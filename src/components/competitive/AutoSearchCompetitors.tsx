import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCompetitorSearch, DetectedCompetitor } from "@/hooks/useCompetitorSearch";
import { Search, ExternalLink, TrendingUp, Globe, Plus } from "lucide-react";
import { useState } from "react";
import { TOTVS_PRODUCTS_MODULES, getModulesByProduct } from "@/lib/data/totvsProductsModules";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AutoSearchCompetitorsProps {
  companyName: string;
  sector?: string;
  totvsProduct?: string;
}

export function AutoSearchCompetitors({
  companyName,
  sector,
  totvsProduct,
}: AutoSearchCompetitorsProps) {
  const searchMutation = useCompetitorSearch();
  const [searchResult, setSearchResult] = useState<any>(null);
  
  // Estados para os dropdowns
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  
  // Estado para produto/módulo customizado
  const [openCustomDialog, setOpenCustomDialog] = useState(false);
  const [customProduct, setCustomProduct] = useState('');
  const [customModule, setCustomModule] = useState('');
  
  // Módulos disponíveis baseado no produto selecionado
  const availableModules = selectedProductId ? getModulesByProduct(selectedProductId) : [];
  
  // Nomes legíveis para busca
  const selectedProductName = TOTVS_PRODUCTS_MODULES.find(p => p.id === selectedProductId)?.name || '';
  const selectedModuleName = availableModules.find(m => m.id === selectedModuleId)?.name || '';

  const handleSearch = async () => {
    // Determinar qual produto e módulo usar (dropdown ou customizado)
    const productToSearch = customProduct || selectedProductName;
    const moduleToSearch = customModule || selectedModuleName;
    
    if (!productToSearch) {
      return;
    }
    
    const result = await searchMutation.mutateAsync({
      companyName,
      sector,
      productCategory: productToSearch,
      keywords: 'PME SMB Brasil ERP',
      totvsProduct: moduleToSearch ? `${productToSearch} - ${moduleToSearch}` : productToSearch,
    });
    setSearchResult(result);
  };
  
  const handleCustomSearch = () => {
    setOpenCustomDialog(false);
    handleSearch();
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Busca em Portais de Comparação
        </CardTitle>
        <CardDescription>
          Busca automática em 41+ portais: G2, Capterra, B2B Stack, Gartner, Forrester, IDC, TI Inside, Baguete, LinkedIn, Reddit e muito mais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção de Produto e Módulo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Produto TOTVS</Label>
            <Select value={selectedProductId} onValueChange={(value) => {
              setSelectedProductId(value);
              setSelectedModuleId(''); // Reset módulo ao trocar produto
              setCustomProduct('');
              setCustomModule('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {TOTVS_PRODUCTS_MODULES.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Módulo / Solução Específica</Label>
            <Select 
              value={selectedModuleId} 
              onValueChange={(value) => {
                setSelectedModuleId(value);
                setCustomModule('');
              }}
              disabled={!selectedProductId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedProductId ? "Selecione o módulo..." : "Primeiro selecione um produto"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availableModules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending || (!selectedProductId && !customProduct)}
            className="flex-1"
          >
            <Search className="mr-2 h-4 w-4" />
            {searchMutation.isPending ? 'Buscando em 41+ Portais...' : 'Buscar Concorrentes'}
          </Button>
          
          <Dialog open={openCustomDialog} onOpenChange={setOpenCustomDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Customizado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buscar Produto/Módulo Customizado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Produto ou Categoria</Label>
                  <Input
                    value={customProduct}
                    onChange={(e) => setCustomProduct(e.target.value)}
                    placeholder="Ex: Sistema de Gestão Personalizado"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Módulo ou Solução Específica (opcional)</Label>
                  <Input
                    value={customModule}
                    onChange={(e) => setCustomModule(e.target.value)}
                    placeholder="Ex: Módulo de Inteligência de Vendas"
                  />
                </div>
                <Button onClick={handleCustomSearch} className="w-full" disabled={!customProduct}>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar nos Portais
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Exibir seleção atual */}
        {(selectedProductName || customProduct) && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              Buscando por: <span className="text-primary">{customProduct || selectedProductName}</span>
              {(selectedModuleName || customModule) && (
                <> → <span className="text-primary">{customModule || selectedModuleName}</span></>
              )}
            </p>
          </div>
        )}

        {searchResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <Badge variant="outline" className="flex items-center justify-center gap-1 py-2">
                <Globe className="h-3 w-3" />
                {searchResult.portals_searched || 0}/{searchResult.total_portals || 41} portais
              </Badge>
              <Badge variant="secondary" className="flex items-center justify-center gap-1 py-2">
                <Search className="h-3 w-3" />
                {searchResult.total_comparisons_found || 0} comparações
              </Badge>
              <Badge variant="default" className="flex items-center justify-center gap-1 py-2">
                <TrendingUp className="h-3 w-3" />
                {searchResult.competitors?.length || 0} concorrentes
              </Badge>
            </div>
            
            {searchResult.product_searched && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold text-primary">Produto pesquisado:</span> {searchResult.product_searched}
                </p>
              </div>
            )}

            <div className="text-sm font-semibold">
              Top {searchResult.competitors?.length || 0} Concorrentes Detectados:
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {searchResult.competitors.map((competitor: DetectedCompetitor, idx: number) => (
                  <Card key={idx} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{competitor.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">
                              {competitor.mentions} menções
                            </Badge>
                            <Badge variant="outline">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Score: {competitor.relevance_score}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {competitor.portals && competitor.portals.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Encontrado em: {competitor.portals.join(', ')}
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-xs font-semibold">Links de Comparação:</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {competitor.comparison_links.map((link, linkIdx) => (
                            <a
                              key={linkIdx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 rounded-md border hover:bg-accent transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <ExternalLink className="h-3 w-3 mt-1 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate">
                                    {link.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {link.snippet}
                                  </div>
                                  <div className="text-xs text-primary mt-1 flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {link.portal}
                                  </div>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
