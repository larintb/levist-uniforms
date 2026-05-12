'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type FallbackFn = (error: Error, reset: () => void) => React.ReactNode;

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode | FallbackFn;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback(this.state.error!, this.reset)
        : this.props.fallback;
    }

    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive/70" />
          <div>
            <p className="text-sm font-medium text-foreground">Ocurrió un problema cargando esta sección</p>
            <p className="text-xs text-muted-foreground mt-0.5">Intenta recargar o vuelve más tarde</p>
          </div>
          <Button variant="outline" size="sm" onClick={this.reset} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }
}
