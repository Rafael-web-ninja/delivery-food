import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function TestCheckout() {
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testProcessCheckout = async () => {
    if (!sessionId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um session ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('Testing process-checkout-success with sessionId:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('process-checkout-success', {
        body: { sessionId: sessionId.trim() }
      });

      console.log('Result:', { data, error });

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);
      toast({
        title: "Sucesso!",
        description: "Função executada com sucesso",
      });

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Teste do Process Checkout Success</CardTitle>
            <CardDescription>
              Teste o edge function process-checkout-success com um session ID do Stripe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="sessionId" className="text-sm font-medium">
                Session ID do Stripe:
              </label>
              <Input
                id="sessionId"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="cs_test_..."
                className="font-mono"
              />
            </div>
            
            <Button 
              onClick={testProcessCheckout}
              disabled={loading || !sessionId.trim()}
              className="w-full"
            >
              {loading ? "Testando..." : "Testar Função"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}