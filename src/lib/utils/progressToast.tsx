import { toast } from 'sonner';

/**
 * Determinate progress toast using Sonner with a visual progress bar.
 * Usage:
 *   const p = createDeterminateProgressToast('Atualizando relatórios...', total)
 *   p.set(3) // updates bar
 *   p.success('Concluído!')
 */
export function createDeterminateProgressToast(title: string, total: number) {
  const id = `progress-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let current = 0;

  const render = () => {
    const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    toast.custom(
      () => (
        <div className="group toast bg-background text-foreground border border-border shadow-lg rounded-md p-3 w-80">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{title}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{percent}%</span>
              <button
                aria-label="Fechar"
                className="text-muted-foreground/70 hover:text-foreground text-xs"
                onClick={() => toast.dismiss(id)}
              >
                ✕
              </button>
            </div>
          </div>
          <div className="mt-2 h-2 bg-muted rounded overflow-hidden">
            <div
              className="h-2 bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{current}/{total} concluído(s)</div>
        </div>
      ),
      { id, duration: Infinity }
    );
  };

  // initial render
  render();

  return {
    set: (value: number, newTitle?: string) => {
      current = Math.max(0, Math.min(value, total));
      if (newTitle) title = newTitle;
      render();
    },
    increment: (delta = 1) => {
      current = Math.max(0, Math.min(current + delta, total));
      render();
    },
    success: (message: string) => {
      toast.success(message, { id, duration: 3000 });
      setTimeout(() => toast.dismiss(id), 3200);
    },
    error: (message: string) => {
      toast.error(message, { id, duration: 4000 });
      setTimeout(() => toast.dismiss(id), 4200);
    },
    dismiss: () => toast.dismiss(id),
  };
}
