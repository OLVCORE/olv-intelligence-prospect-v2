import { ReactNode, useRef } from 'react';
import Draggable from 'react-draggable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GripHorizontal } from 'lucide-react';

interface DraggableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

export function DraggableDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = 'max-w-2xl',
  maxWidth
}: DraggableDialogProps) {
  const nodeRef = useRef(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${className} ${maxWidth || 'max-h-[90vh]'} overflow-y-auto`}
      >
        <Draggable 
          handle=".draggable-handle" 
          nodeRef={nodeRef}
          bounds="parent"
          defaultPosition={{ x: 0, y: 0 }}
        >
          <div ref={nodeRef} className="w-full">
            {(title || description) && (
              <DialogHeader className="draggable-handle cursor-move bg-muted/30 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-lg border-b flex flex-row items-center gap-2">
                <GripHorizontal className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  {title && <DialogTitle>{title}</DialogTitle>}
                  {description && <DialogDescription>{description}</DialogDescription>}
                </div>
              </DialogHeader>
            )}
            <div className="select-text">
              {children}
            </div>
          </div>
        </Draggable>
      </DialogContent>
    </Dialog>
  );
}
