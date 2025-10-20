import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, LayoutDashboard, Search, Server, Brain, Target, TrendingUp } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-center">
        <Building2 className="h-24 w-24 text-white mb-6" />
        <h1 className="text-6xl font-bold text-white mb-4">
          OLV Intelligence
        </h1>
        <p className="text-xl text-white/80 mb-8 max-w-2xl">
          Sistema de Prospecção Inteligente com dados reais de empresas B2B
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/dashboard">
              Acessar Dashboard
              <LayoutDashboard className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-white/10 text-white border-white/20 hover:bg-white/20">
            <Link to="/search">
              Buscar Empresas
              <Search className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-white/80">
          <div>
            <Server className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Tech Stack</p>
          </div>
          <div>
            <Brain className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Decisores</p>
          </div>
          <div>
            <Target className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Maturidade</p>
          </div>
          <div>
            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Fit TOTVS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
