import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-destructive">
                Erro na Autenticação
              </CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado. Por favor, recarregue a página.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Erro: {this.state.error?.message || 'Erro desconhecido'}
                </p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Recarregar Página
              </Button>
              <Button 
                onClick={() => this.setState({ hasError: false })} 
                variant="outline"
                className="w-full"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}