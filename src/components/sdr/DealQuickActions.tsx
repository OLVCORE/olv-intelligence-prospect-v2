import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';

interface DealQuickActionsProps {
  deal: any;
}

export function DealQuickActions({ deal }: DealQuickActionsProps) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground text-center">
        IA de sugestões em desenvolvimento
      </p>
    </Card>
  );
}
