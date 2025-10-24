import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function MobileOptimizedLayout({ children, header, sidebar }: MobileOptimizedLayoutProps) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // Detect mobile keyboard opening
    const handleResize = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      const screenHeight = window.screen.height;
      setIsKeyboardOpen(vh < screenHeight * 0.75);
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Mobile-optimized viewport */}
      <div 
        className={cn(
          "transition-all duration-300",
          isKeyboardOpen && "pb-0"
        )}
        style={{
          minHeight: isKeyboardOpen ? 'auto' : '100vh',
          height: isKeyboardOpen ? 'auto' : '100%'
        }}
      >
        {header}
        <div className="flex w-full">
          {sidebar}
          <main className="flex-1 w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
