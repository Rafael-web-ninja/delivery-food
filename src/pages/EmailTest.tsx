import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Mail, Send } from 'lucide-react';

export default function EmailTest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira um email para teste",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testando envio de email para:', email);
      
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { email: email.trim() }
      });

      console.log('Resultado do teste:', { data, error });

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);
      
      if (data?.success) {
        toast({
          title: "✅ Email enviado!",
          description: "Verifique sua caixa de entrada. O email pode demorar alguns minutos.",
        });
      } else {
        throw new Error('Falha desconhecida no envio');
      }

    } catch (error: any) {
      console.error('Erro no teste de email:', error);
      toast({
        title: "❌ Erro no teste",
        description: error.message,
        variant: "destructive"
      });
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testPasswordReset = async () => {
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira um email para teste",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Testando recuperação de senha para:', email);
      
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: email.trim() }
      });

      console.log('Resultado do reset:', { data, error });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "✅ Email de recuperação enviado!",
          description: "Verifique sua caixa de entrada.",
        });
      } else {
        throw new Error('Falha ao enviar email de recuperação');
      }

    } catch (error: any) {
      console.error('Erro no teste de recuperação:', error);
      toast({
        title: "❌ Erro na recuperação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              🧪 Teste de Email - Verificação do Resend
            </CardTitle>
            <CardDescription>
              Teste o sistema de envio de emails para verificar se o Resend está funcionando corretamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email para teste:
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={testEmail}
                disabled={loading || !email.trim()}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Testando..." : "🧪 Teste Simples"}
              </Button>
              
              <Button 
                onClick={testPasswordReset}
                disabled={loading || !email.trim()}
                variant="outline"
                className="flex-1"
              >
                {loading ? "Testando..." : "🔄 Teste Recuperação"}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>• <strong>Teste Simples:</strong> Envia email básico de verificação</p>
              <p>• <strong>Teste Recuperação:</strong> Testa o fluxo completo de reset de senha</p>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Resultado - Sucesso
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Resultado - Erro
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "✅ SUCESSO" : "❌ FALHOU"}
                  </Badge>
                  {result.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
                
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-800">
              <strong>💡 Dica:</strong> Se os emails não estão chegando, verifique:
            </p>
            <ul className="text-xs text-orange-700 mt-2 space-y-1">
              <li>• Caixa de spam/lixo eletrônico</li>
              <li>• Se o domínio está verificado no Resend</li>
              <li>• Se a chave API está configurada corretamente</li>
              <li>• Se há atividade no painel do Resend</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}