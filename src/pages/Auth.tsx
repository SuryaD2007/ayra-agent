import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { AuthComponent } from '@/components/ui/sign-up';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signUp, login } = useAuth();
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/manage');
    }
  }, [isAuthenticated, navigate]);

  const AyraLogo = () => (
    <div className="bg-primary text-primary-foreground rounded-md p-1.5">
      <Brain className="h-4 w-4" />
    </div>
  );

  // Note: The AuthComponent is a demo UI component
  // For now, we'll keep the existing modal-based auth until we can integrate this fully
  // Redirect back to home
  useEffect(() => {
    navigate('/');
  }, [navigate]);

  return <AuthComponent logo={<AyraLogo />} brandName="Ayra" />;
};

export default Auth;
