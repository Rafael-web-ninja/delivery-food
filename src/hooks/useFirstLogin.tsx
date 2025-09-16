import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFirstLogin = () => {
  const { user, initialized } = useAuth();
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    const checkFirstLogin = async () => {
      if (!initialized || !user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Check if user is a customer and if it's their first login
        const { data: profile, error } = await supabase
          .from('customer_profiles')
          .select('first_login_completed, temp_password_sent')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking first login status:', error);
          setLoading(false);
          return;
        }

        if (profile) {
          // User is a customer
          const needsPasswordChange = profile.temp_password_sent && !profile.first_login_completed;
          setIsFirstLogin(needsPasswordChange);
          
          // Show password change modal if it's first login and temp password was sent
          if (needsPasswordChange) {
            // Add small delay to ensure UI is ready
            setTimeout(() => {
              setShowPasswordChange(true);
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error in checkFirstLogin:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFirstLogin();
  }, [user?.id, initialized]);

  const handlePasswordChangeComplete = () => {
    setShowPasswordChange(false);
    setIsFirstLogin(false);
  };

  const handleSkipPasswordChange = () => {
    setShowPasswordChange(false);
    setIsFirstLogin(false);
  };

  return {
    isFirstLogin,
    loading,
    showPasswordChange,
    handlePasswordChangeComplete,
    handleSkipPasswordChange
  };
};