import { Copyright, User } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition';

interface FooterProps {
  show: boolean;
}

export const Footer = ({ show }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <AnimatedTransition show={show} animation="fade" duration={600}>
      <footer className="mt-16 py-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            {/* Creator Attribution */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <User size={16} />
              <span className="text-sm">
                Created by <span className="font-semibold text-foreground">Surya Degala</span>
              </span>
            </div>
            
            {/* Copyright Notice */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Copyright size={16} />
              <span className="text-sm">
                © {currentYear} Ayra. All rights reserved.
              </span>
            </div>
            
            {/* Additional Legal Text */}
            <p className="text-xs text-muted-foreground/80 max-w-md">
              This software and its contents are protected by copyright law. 
              Unauthorized reproduction or distribution is strictly prohibited.
            </p>
          </div>
        </div>
      </footer>
    </AnimatedTransition>
  );
};