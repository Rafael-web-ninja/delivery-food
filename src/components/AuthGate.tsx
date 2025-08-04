import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AuthGateProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGate({ children, requireAuth = true }: AuthGateProps) {
  // ALL HOOKS MUST BE CALLED AT THE TOP - NO CONDITIONAL HOOKS
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();

  // EFFECT ALWAYS RUNS - CONDITIONAL LOGIC INSIDE
  useEffect(() => {
    // Only redirect if we need auth, not loading, initialized, and no user
    if (requireAuth && !loading && initialized && !user) {
      navigate("/auth");
    }
  }, [loading, initialized, requireAuth, user, navigate]);

  // CONDITIONAL RENDERING AFTER ALL HOOKS
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
