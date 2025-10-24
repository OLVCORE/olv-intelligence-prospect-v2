import React, { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Loader2 } from 'lucide-react';

interface AsyncBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onReset?: () => void;
  context?: string;
}

const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function AsyncBoundary({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback,
  onReset,
  context,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={errorFallback}
      onReset={onReset}
      context={context}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
