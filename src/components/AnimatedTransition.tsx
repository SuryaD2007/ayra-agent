import React from 'react';
import { cn } from '@/lib/utils';

export type AnimationType = 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'scale-bounce' | 'slide-in-left' | 'slide-in-right' | 'fade-in';

interface AnimatedTransitionProps {
  children?: React.ReactNode;
  show: boolean;
  duration?: number;
  animation?: AnimationType;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
  children,
  show,
  duration = 300,
  animation = 'fade',
  className,
  style,
}) => {
  const [render, setRender] = React.useState(show);

  React.useEffect(() => {
    if (show) setRender(true);
    
    let timer: NodeJS.Timeout;
    if (!show && render) {
      timer = setTimeout(() => {
        setRender(false);
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, render, duration]);

  if (!render) return null;

  const animationClasses = {
    fade: show ? 'animate-fade-in' : 'animate-fade-out',
    scale: show ? 'animate-scale-in' : 'animate-fade-out',
    'slide-up': show ? 'animate-slide-up' : 'animate-fade-out',
    'slide-down': show ? 'animate-slide-down' : 'animate-fade-out',
    'scale-bounce': show ? 'animate-scale-bounce' : 'animate-fade-out',
    'slide-in-left': show ? 'animate-slide-in-left' : 'animate-fade-out',
    'slide-in-right': show ? 'animate-slide-in-right' : 'animate-fade-out',
    'fade-in': show ? 'animate-fade-in' : 'animate-fade-out',
  };

  return (
    <div
      className={cn(
        animationClasses[animation],
        className,
      )}
      style={{
        animationDuration: `${duration}ms`,
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedTransition;