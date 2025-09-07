import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import AuthGuard from '@/components/auth/AuthGuard';
import InlineError from '@/components/auth/InlineError';
import AuthModal from '@/components/AuthModal';
import { Search } from '@/components/search';

const SearchPage = () => {
  const showContent = useAnimateIn(false, 300);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Get itemId from URL parameters
  const itemId = searchParams.get('itemId');

  return (
    <AuthGuard 
      title="Search your knowledge"
      description="Sign in to search through your notes, documents, and saved content."
    >
      <div className="flex h-screen">
        {authError && (
          <div className="absolute top-4 left-4 right-4 z-50">
            <InlineError 
              message={authError}
              onSignIn={() => setAuthModalOpen(true)}
            />
          </div>
        )}
        
        <AnimatedTransition show={showContent} animation="slide-up" className="flex w-full">
          <Search itemId={itemId} />
        </AnimatedTransition>

        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
        />
      </div>
    </AuthGuard>
  );
};

export default SearchPage;