import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';

export function ScrollControls() {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShowUp(y > 200);
      setShowDown(max - y > 200);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  return (
    <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-3">
      {showUp && (
        <Button
          size="icon"
          variant="secondary"
          onClick={scrollTop}
          className="h-10 w-10 rounded-full shadow-lg"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
      {showDown && (
        <Button
          size="icon"
          variant="secondary"
          onClick={scrollBottom}
          className="h-10 w-10 rounded-full shadow-lg"
          aria-label="Ir ao final"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default ScrollControls;
