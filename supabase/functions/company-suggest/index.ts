// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

type SuggestSource = 'apollo' | 'linkedin' | 'google';

const ORIGINS = new Set<string>([
    'http://localhost:3000',
    'http://localhost:5173',
    'https://83aa9319-3cdb-4039-89a3-d5632b977732.lovableproject.com'
]);

const schema = z.object({
    query: z.string().min(2),
    segment: z.string().optional(),
    limit: z.number().min(1).max(15).optional().default(8)
});

function cors(origin: string) {
    const allow = ORIGINS.has(origin) ? origin : '*';
    return {
        'access-control-allow-origin': allow,
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'POST,OPTIONS',
        'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type'
    };
}

serve(async (req: Request) => {
    const c = cors(req.headers.get('origin') || '');
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: c });

    try {
        if (!req.headers.get('authorization')?.startsWith('Bearer ')) {
            return J({ error: 'missing_or_invalid_authorization' }, 401, c);
        }
        if (!req.headers.get('content-type')?.includes('application/json')) {
            return J({ error: 'invalid_content_type' }, 400, c);
        }

        const body = await req.json().catch(() => null) as any;
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return J({ error: 'invalid_payload', hint: parsed.error.issues?.[0]?.message }, 400, c);
        }

        const { query, segment, limit } = parsed.data;
        const tokens = tokenize(query);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const [apolloRes, linkedinRes, googleRes] = await Promise.allSettled([
            searchApolloCompanies(tokens, segment, { signal: controller.signal }),
            searchLinkedInViaWeb(tokens, segment, { signal: controller.signal }),
            searchGoogleCompanies(tokens, segment, { signal: controller.signal })
        ]);

        clearTimeout(timeout);

        const apollo = settledToArray(apolloRes);
        const linkedin = settledToArray(linkedinRes);
        const google = settledToArray(googleRes);

        const merged = mergeDedupRank({ apollo, linkedin, google, tokens, segment });
        const top = merged.slice(0, limit);

        return J({ ok: true, query, tokens, suggestions: top }, 200, c);
    } catch (e: any) {
        const aborted = String(e?.name || '').toLowerCase().includes('abort');
        if (aborted) return J({ error: 'timeout', hint: 'Tempo excedido no suggest' }, 504, c);
        return J({ error: 'internal_error', message: String(e?.message || e) }, 500, c);
    }
});

function J(data: unknown, status: number, headers: Record<string, string>) {
    return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...headers } });
}

function tokenize(q: string): string[] {
    return q
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s.&-]/g, ' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 1);
}

function settledToArray(s: PromiseSettledResult<Item[]>): Item[] {
    if (s.status === 'fulfilled' && Array.isArray(s.value)) return s.value;
    return [];
}

type Item = {
    source: SuggestSource;
    name: string;
    domain?: string | null;
    location?: string | null;
    industry?: string | null;
    employees?: number | null;
    apollo_org_id?: string | null;
    linkedin_company_id?: string | null;
    linkedin_url?: string | null;
    website?: string | null;
    score?: number;
    why?: string[];
};

function mergeDedupRank(params: { apollo: Item[]; linkedin: Item[]; google: Item[]; tokens: string[]; segment?: string; }): Item[] {
    const pool: Item[] = [...params.apollo, ...params.linkedin, ...params.google];
    const seen = new Set<string>();
    const out: Item[] = [];

    for (const it of pool) {
        const key = (it.linkedin_url || it.domain || normalizeName(it.name)) ?? '';
        if (!key) continue;
        if (seen.has(key)) continue;
        seen.add(key);

        const score = rank(it, params.tokens, params.segment);
        const why = explain(it, params.tokens, params.segment);
        out.push({ ...it, score, why });
    }

    out.sort((a, b) => {
        if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0);
        if (a.source === 'apollo' && b.source !== 'apollo') return -1;
        if (b.source === 'apollo' && a.source !== 'apollo') return 1;
        return 0;
    });

    return out;
}

function normalizeName(raw: string): string {
    return raw
        .replace(/[^\w\s]/g, ' ')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function rank(it: Item, tokens: string[], segment?: string): number {
    let s = 0;
    const name = normalizeName(it.name);
    const domain = (it.domain || '').toLowerCase();
    const industry = (it.industry || '').toLowerCase();
    for (const t of tokens) {
        if (name.includes(t)) s += 0.4;
        if (domain.includes(t)) s += 0.2;
    }
    if (segment && industry.includes(segment.toLowerCase())) s += 0.2;
    if (it.source === 'apollo') s += 0.1;
    if (it.linkedin_url) s += 0.1;
    return Math.min(1, s);
}

function explain(it: Item, tokens: string[], segment?: string): string[] {
    const why: string[] = [];
    const name = normalizeName(it.name);
    const domain = (it.domain || '').toLowerCase();
    const industry = (it.industry || '').toLowerCase();
    const hits = tokens.filter(t => name.includes(t) || domain.includes(t));
    if (hits.length) why.push(`Tokens: ${hits.join(', ')}`);
    if (segment && industry.includes(segment.toLowerCase())) why.push(`Segmento: ${segment}`);
    if (it.source === 'apollo') why.push('Fonte: Apollo');
    if (it.linkedin_url) why.push('Vínculo: LinkedIn');
    return why;
}

async function searchApolloCompanies(tokens: string[], segment?: string, opts?: { signal?: AbortSignal }): Promise<Item[]> {
    const apiKey = Deno.env.get('APOLLO_API_KEY');
    if (!apiKey) return [];

    try {
        const q = tokens.join(' ');
        const response = await fetch('https://api.apollo.io/v1/organizations/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey
            },
            body: JSON.stringify({
                q_organization_name: q,
                page: 1,
                per_page: 10
            }),
            signal: opts?.signal
        });

        if (!response.ok) return [];

        const data = await response.json() as any;
        const orgs = Array.isArray(data.organizations) ? data.organizations : [];

        return orgs.map((org: any) => ({
            source: 'apollo' as SuggestSource,
            name: String(org.name || ''),
            domain: org.primary_domain || null,
            location: org.city ? `${org.city}, ${org.state || org.country || ''}`.trim() : null,
            industry: org.industry || null,
            employees: org.estimated_num_employees || null,
            apollo_org_id: org.id || null,
            linkedin_url: org.linkedin_url || null,
            website: org.website_url || null
        }));
    } catch (e) {
        console.error('[Apollo] Search error:', e);
        return [];
    }
}

async function searchLinkedInViaWeb(tokens: string[], segment?: string, opts?: { signal?: AbortSignal }): Promise<Item[]> {
    const cseId = Deno.env.get('GOOGLE_CSE_ID');
    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!cseId || !apiKey) return [];

    try {
        const q = buildLinkedInQuery(tokens);
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(q)}&num=10`;
        const res = await fetch(url, { signal: opts?.signal });
        if (!res.ok) return [];
        const data = await res.json() as any;
        const items = Array.isArray(data.items) ? data.items : [];
        return items
            .map((it: any) => {
                const title = String(it.title || '').replace(/ - LinkedIn$/i, '').trim();
                const link = String(it.link || '').trim();
                const name = title || link;
                return {
                    source: 'linkedin' as SuggestSource,
                    name,
                    linkedin_url: link,
                    domain: null,
                    industry: null,
                    employees: null
                };
            })
            .filter((x: Item) => x.linkedin_url?.includes('linkedin.com/company/'));
    } catch (e) {
        console.error('[LinkedIn] Search error:', e);
        return [];
    }
}

function buildLinkedInQuery(tokens: string[]): string {
    const quoted = tokens.map(t => `"${t}"`).join(' AND ');
    return `${quoted} site:linkedin.com/company`;
}

async function searchGoogleCompanies(tokens: string[], segment?: string, opts?: { signal?: AbortSignal }): Promise<Item[]> {
    const cseId = Deno.env.get('GOOGLE_CSE_ID');
    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!cseId || !apiKey) return [];

    try {
        const q = tokens.join(' ');
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(q)}&num=10`;
        const res = await fetch(url, { signal: opts?.signal });
        if (!res.ok) return [];
        const data = await res.json() as any;
        const items = Array.isArray(data.items) ? data.items : [];
        return items.map((it: any) => {
            const name = String(it.title || '').trim();
            const link = String(it.link || '').trim();
            const domain = safeDomain(link);
            return {
                source: 'google' as SuggestSource,
                name,
                website: link,
                domain
            };
        });
    } catch (e) {
        console.error('[Google] Search error:', e);
        return [];
    }
}

function safeDomain(url: string): string | null {
    try {
        const u = new URL(url);
        return u.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}
