import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Users, MapPin } from 'lucide-react';
import { SuggestItem, useCompanyActions } from '@/hooks/useCompanyActions';
import { useNavigate } from 'react-router-dom';

interface CompanyGlobalSearchProps {
  segment?: string;
  onSelect?: (companyId: string) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return deb;
}

export default function CompanyGlobalSearch({ segment, onSelect }: CompanyGlobalSearchProps) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SuggestItem[]>([]);
  const debounced = useDebounce(q, 300);
  const { ensureCompanyRecord, enrichAll, lockLinkedIn } = useCompanyActions();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      if (!debounced || debounced.length < 2) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('company-suggest', {
          body: { query: debounced, segment, limit: 8 }
        });
        if (error) throw error;
        if (!active) return;
        setItems(data?.suggestions || []);
      } catch (e: any) {
        console.error('[CompanyGlobalSearch] Error:', e);
        if (!active) return;
        toast.error('Falha ao buscar sugestões');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [debounced, segment]);

  const handleSelect = async (it: SuggestItem) => {
    try {
      if (it.apollo_org_id) {
        const companyId = await ensureCompanyRecord(it);
        await enrichAll(companyId, it.apollo_org_id);
        toast.success('Empresa enriquecida via Apollo');
        if (onSelect) {
          onSelect(companyId);
        } else {
          navigate(`/company/${companyId}`);
        }
        setQ('');
        setItems([]);
        return;
      }

      if (it.linkedin_url) {
        const companyId = await ensureCompanyRecord(it);
        await lockLinkedIn(companyId, it.linkedin_url);
        toast.success('Empresa vinculada ao LinkedIn');
        if (onSelect) {
          onSelect(companyId);
        } else {
          navigate(`/company/${companyId}`);
        }
        setQ('');
        setItems([]);
        return;
      }

      const companyId = await ensureCompanyRecord(it);
      toast.success('Empresa registrada');
      if (onSelect) {
        onSelect(companyId);
      } else {
        navigate(`/company/${companyId}`);
      }
      setQ('');
      setItems([]);
    } catch (e) {
      console.error('[CompanyGlobalSearch] Select error:', e);
      toast.error('Falha ao processar seleção');
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'apollo': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'linkedin': return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300';
      case 'google': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar empresas (Apollo + LinkedIn + Google)"
          className="pl-10"
          aria-label="Buscar empresas"
        />
      </div>

      {loading && (
        <Card className="absolute top-full mt-2 w-full z-50 p-4">
          <p className="text-sm text-muted-foreground">Buscando empresas...</p>
        </Card>
      )}

      {!loading && items.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto">
          <div className="divide-y divide-border">
            {items.map((it, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(it)}
                className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getSourceColor(it.source)}>
                        {it.source}
                      </Badge>
                      <span className="font-semibold truncate">{it.name}</span>
                      {it.domain && (
                        <span className="text-sm text-muted-foreground truncate">
                          · {it.domain}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                      {it.industry && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {it.industry}
                        </span>
                      )}
                      {it.employees && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {it.employees} funcionários
                        </span>
                      )}
                      {it.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {it.location}
                        </span>
                      )}
                      {it.linkedin_url && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          LinkedIn
                        </span>
                      )}
                    </div>

                    {it.why && it.why.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {it.why.join(' • ')}
                      </div>
                    )}

                    {it.score !== undefined && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${it.score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(it.score * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
