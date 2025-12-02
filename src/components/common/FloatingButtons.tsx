import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Componente ÚNICO para gerenciar TODOS os botões flutuantes de scroll
 * Posicionamento: Canto inferior DIREITO, acima do Trevo e Copilot
 */
export function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!showScrollTop) return null;

  return (
    <div className="fixed bottom-48 right-4 z-[98] flex flex-col gap-3">
      {/* Botão Voltar ao Topo */}
      <Button
        onClick={scrollToTop}
        size="icon"
        variant="secondary"
        className="h-12 w-12 rounded-full shadow-2xl hover:scale-110 transition-all duration-300"
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
}

