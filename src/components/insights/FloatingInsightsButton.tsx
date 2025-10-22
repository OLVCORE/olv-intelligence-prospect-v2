import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingInsightsButtonProps {
  onClick: () => void;
  className?: string;
}

export function FloatingInsightsButton({ onClick, className }: FloatingInsightsButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed top-20 right-6 z-50 shadow-lg hover:shadow-xl transition-all duration-300",
        "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
        "text-white font-semibold px-6 py-6 rounded-full",
        "flex items-center gap-2 group",
        className
      )}
    >
      <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
      <span className="text-sm">Insights</span>
    </Button>
  );
}
