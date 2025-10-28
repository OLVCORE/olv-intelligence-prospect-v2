import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Building2, MapPin, Users, Globe, Mail, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApolloOrganization {
  id: string;
  name: string;
  website_url?: string;
  primary_domain?: string;
  city?: string;
  state?: string;
  country?: string;
  estimated_num_employees?: number;
  employee_range?: string;
  industry?: string;
  linkedin_url?: string;
  match_score?: number;
}

interface ApolloSearchDialogProps {
  companyName?: string;
  companyDomain?: string;
  onSelect: (org: ApolloOrganization) => void;
  trigger?: React.ReactNode;
}

export function ApolloSearchDialog({
  companyName = "",
  companyDomain,
  onSelect,
  trigger
}: ApolloSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchName, setSearchName] = useState(companyName);
  const [results, setResults] = useState<ApolloOrganization[]>([]);
  const [apolloUrl, setApolloUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleSearch = async () => {
    if (!searchName.trim()) {
      toast.error("Digite um nome para buscar");
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          type: 'search_organizations',
          searchName: searchName.trim(),
          domain: companyDomain
        }
      });

      if (error) throw error;

      if (data?.organizations && data.organizations.length > 0) {
        setResults(data.organizations);
        setShowUrlInput(false);
      } else {
        setResults([]);
        setShowUrlInput(true);
        toast.info("Nenhuma empresa encontrada. Cole a URL do Apollo manualmente.");
      }
    } catch (error: any) {
      console.error('Erro ao buscar no Apollo:', error);
      toast.error("Erro ao buscar no Apollo");
      setShowUrlInput(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchByUrl = async () => {
    if (!apolloUrl.trim()) {
      toast.error("Cole a URL do Apollo");
      return;
    }

    // Extrair org ID da URL
    const urlPattern = /organizations?\/([a-f0-9]+)/i;
    const match = apolloUrl.match(urlPattern);
    
    if (!match) {
      toast.error("URL inválida do Apollo");
      return;
    }

    const orgId = match[1];
    setSearching(true);

    try {
      const { data, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          type: 'get_organization_by_id',
          organizationId: orgId
        }
      });

      if (error) throw error;

      if (data?.organization) {
        onSelect(data.organization);
        setOpen(false);
        toast.success("Empresa encontrada no Apollo!");
      } else {
        toast.error("Empresa não encontrada com esta URL");
      }
    } catch (error: any) {
      console.error('Erro ao buscar por URL:', error);
      toast.error("Erro ao buscar empresa no Apollo");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectOrg = (org: ApolloOrganization) => {
    onSelect(org);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Buscar no Apollo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Buscar Empresa no Apollo</DialogTitle>
          <DialogDescription>
            Busque e selecione a empresa correta no Apollo.io
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search-name">Nome da Empresa</Label>
              <Input
                id="search-name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Digite o nome da empresa..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {results.map((org) => (
                  <Card key={org.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-semibold">{org.name}</h3>
                              {org.match_score && (
                                <Badge variant={org.match_score >= 80 ? "default" : "secondary"}>
                                  {org.match_score}% Match
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {org.city && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{org.city}{org.state ? `, ${org.state}` : ''} - {org.country}</span>
                            </div>
                          )}
                          {org.estimated_num_employees && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{org.employee_range || `${org.estimated_num_employees} funcionários`}</span>
                            </div>
                          )}
                          {org.primary_domain && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span>{org.primary_domain}</span>
                            </div>
                          )}
                          {org.industry && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{org.industry}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://app.apollo.io/#/organizations/${org.id}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ver no Apollo
                          </Button>
                          {org.linkedin_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(org.linkedin_url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              LinkedIn
                            </Button>
                          )}
                          {org.website_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(org.website_url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Website
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleSelectOrg(org)}
                            className="ml-auto"
                          >
                            Selecionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Not Found / Manual URL Input */}
          {showUrlInput && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-sm">Empresa não encontrada no Apollo</h4>
                  <p className="text-sm text-muted-foreground">
                    Busque manualmente no Apollo e cole a URL da empresa aqui.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open('https://app.apollo.io/#/organizations', '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Abrir Apollo
                    </Button>
                    {companyDomain && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://${companyDomain}`, '_blank')}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apollo-url">URL da Empresa no Apollo</Label>
                <div className="flex gap-2">
                  <Input
                    id="apollo-url"
                    value={apolloUrl}
                    onChange={(e) => setApolloUrl(e.target.value)}
                    placeholder="https://app.apollo.io/#/organizations/..."
                  />
                  <Button onClick={handleSearchByUrl} disabled={searching}>
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Buscar"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
