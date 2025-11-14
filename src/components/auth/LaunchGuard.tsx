import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LaunchGuardProps {
  children: React.ReactNode;
}

const LaunchGuard = ({ children }: LaunchGuardProps) => {
  // Launch time: November 14, 2025, 6:20 PM CST (00:20 UTC Nov 15)
  const LAUNCH_TIME = new Date('2025-11-15T00:20:00Z').getTime();
  const DISPLAY_TIME = '6:30 PM CST'; // What we tell users
  
  const [isLaunched, setIsLaunched] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const checkLaunchTime = () => {
      const now = Date.now();
      const launched = now >= LAUNCH_TIME;
      setIsLaunched(launched);

      if (!launched) {
        const diff = LAUNCH_TIME - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    checkLaunchTime();
    const interval = setInterval(checkLaunchTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (isLaunched) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Ayra is launching soon!
          </h1>
          
          <p className="text-xl text-muted-foreground">
            We're going live at {DISPLAY_TIME} today
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 space-y-4">
          <p className="text-lg text-muted-foreground">
            Time until launch
          </p>
          <p className="text-4xl font-mono font-bold text-primary">
            {timeRemaining}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Thank you for your patience. Refresh this page after {DISPLAY_TIME} to access the app.
        </p>
      </div>
    </div>
  );
};

export default LaunchGuard;
