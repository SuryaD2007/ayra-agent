
import React from 'react';
import Search from '@/components/search';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { useSearchParams } from 'react-router-dom';

const SearchPage = () => {
  const showContent = useAnimateIn(false, 300);
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('itemId');
  
  return (
    <div className="max-w-full mx-auto px-4 pt-24 pb-6">
      <AnimatedTransition show={showContent} animation="slide-up">
        <Search itemId={itemId} />
      </AnimatedTransition>
    </div>
  );
};

export default SearchPage;
