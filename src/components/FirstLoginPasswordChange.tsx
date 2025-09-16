import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FirstLoginPasswordChangeProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

export const FirstLoginPasswordChange = ({ isOpen, onClose, onSkip }: FirstLoginPasswordChangeProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordChange = async () => {
    setError('');
    
    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Preencha todos os campos');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    
    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Mark first login as completed
      if (user?.id) {
        await supabase
          .from('customer_profiles')
          .update({ first_login_completed: true })
          .eq('user_id', user.id);
      }

      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua nova senha foi definida. Agora você pode usar o sistema normalmente.",
        duration: 5000,
      });

      onClose();
    } catch (error: any) {
      console.error('Error changing password:', error);
      setError(error.message || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (user?.id) {
      try {
        // Mark first login as completed even if password wasn't changed
        await supabase
          .from('customer_profiles')
          .update({ first_login_completed: true })
          .eq('user_id', user.id);
        
        onSkip();
      } catch (error) {
        console.error('Error marking first login complete:', error);
        onSkip(); // Continue anyway
      }
    } else {
      onSkip();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Alterar Senha
          </DialogTitle>
          <DialogDescription>
            Recomendamos alterar sua senha temporária para uma mais segura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Lock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Primeira vez no sistema?</strong><br />
              Você recebeu uma senha temporária por email. Para maior segurança, 
              crie uma nova senha personalizada.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handlePasswordChange}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Alterando..." : "Alterar Senha"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSkip}
              disabled={loading}
              className="w-full"
            >
              Alterar Depois
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Você pode alterar sua senha a qualquer momento nas configurações do perfil.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};