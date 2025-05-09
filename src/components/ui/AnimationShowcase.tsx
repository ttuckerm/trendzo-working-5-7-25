import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedContainer, AnimatedList } from '@/components/ui/AnimatedContainer';
import { PageTransition } from '@/components/ui/PageTransition';
import { InteractiveElement } from '@/components/ui/InteractiveElement';
import { SkeletonLoader, CardSkeleton, TableSkeleton } from '@/components/ui/SkeletonLoader';
import { useAnimationContext } from '@/lib/contexts/AnimationContext';
import { AnimatedTransition } from '@/components/ui/AnimatedContainer';

/**
 * Animation Showcase demonstrates all the various animation components
 * and features available in the system.
 */
export default function AnimationShowcase() {
  const { 
    animationsEnabled, 
    setAnimationsEnabled, 
    animationScale, 
    setAnimationScale, 
    prefersReducedMotion 
  } = useAnimationContext();
  
  const [showSection1, setShowSection1] = useState(true);
  const [showSection2, setShowSection2] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  
  // List items for demonstration
  const listItems = [
    'Item 1 - First item with staggered animation',
    'Item 2 - Second item appears after first',
    'Item 3 - Third item continues the sequence',
    'Item 4 - Final item in the staggered sequence',
  ];

  return (
    <PageTransition className="space-y-8 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Animation System Showcase</h1>
        <p className="text-lg mb-4">
          This showcase demonstrates the animation system's capabilities and how to use them.
        </p>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-8">
          <div className="p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="font-medium mb-2">Animation Settings</h3>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="animations-toggle" className="mr-4">
                Animations Enabled:
              </label>
              <div className="form-switch">
                <input
                  type="checkbox"
                  id="animations-toggle"
                  className="sr-only"
                  checked={animationsEnabled}
                  onChange={() => setAnimationsEnabled(!animationsEnabled)}
                />
                <div className={`switch-toggle ${animationsEnabled ? 'bg-primary-500' : 'bg-neutral-300'}`}></div>
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="animation-scale" className="block mb-2">
                Animation Scale: {animationScale}
              </label>
              <input
                type="range"
                id="animation-scale"
                min="0"
                max="2"
                step="0.1"
                value={animationScale}
                onChange={(e) => setAnimationScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            {prefersReducedMotion && (
              <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
                Reduced motion preference detected. Animations are minimized.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Animated Container Demo */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Animated Containers</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setShowSection1(!showSection1)}>
            {showSection1 ? 'Hide' : 'Show'} Container
          </Button>
          
          <div className="w-full mt-4">
            <AnimatedContainer
              show={showSection1}
              variant="fadeIn"
              className="bg-white border p-4 rounded-lg shadow-sm"
            >
              <h3 className="text-xl font-medium mb-2">Fade In Container</h3>
              <p>This container uses the fadeIn animation when showing/hiding.</p>
            </AnimatedContainer>
          </div>
          
          <div className="w-full mt-4">
            <AnimatedContainer
              show={showSection1}
              variant="slideInFromLeft"
              className="bg-white border p-4 rounded-lg shadow-sm"
            >
              <h3 className="text-xl font-medium mb-2">Slide In Container</h3>
              <p>This container slides in from the left side.</p>
            </AnimatedContainer>
          </div>
          
          <div className="w-full mt-4">
            <AnimatedContainer
              show={showSection1}
              variant="scale"
              className="bg-white border p-4 rounded-lg shadow-sm"
            >
              <h3 className="text-xl font-medium mb-2">Scale Container</h3>
              <p>This container scales in and out with a subtle effect.</p>
            </AnimatedContainer>
          </div>
        </div>
      </section>
      
      {/* Animated List Demo */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Animated Lists</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setShowSection2(!showSection2)}>
            {showSection2 ? 'Hide' : 'Show'} List
          </Button>
          
          <div className="w-full mt-4">
            <AnimatedList
              show={showSection2}
              variant="fadeIn"
              staggerDelay={0.1}
              className="bg-white border rounded-lg shadow-sm"
              itemClassName="p-4 border-b last:border-b-0"
            >
              {listItems.map((item) => (
                <div key={item}>
                  <p>{item}</p>
                </div>
              ))}
            </AnimatedList>
          </div>
        </div>
      </section>
      
      {/* Interactive Elements Demo */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Interactive Elements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InteractiveElement
            variant="button"
            className="bg-primary-500 text-white px-4 py-2 rounded-md"
            onClick={() => alert('Button clicked!')}
          >
            Interactive Button
          </InteractiveElement>
          
          <InteractiveElement
            variant="card"
            className="bg-white border p-4 rounded-lg"
            onClick={() => alert('Card clicked!')}
          >
            <h3 className="text-lg font-medium mb-2">Interactive Card</h3>
            <p>This card has hover and click animations.</p>
          </InteractiveElement>
          
          <InteractiveElement
            variant="link"
            className="text-primary-500"
            onClick={() => alert('Link clicked!')}
          >
            Interactive Link
          </InteractiveElement>
          
          <InteractiveElement
            variant="scale"
            className="bg-neutral-800 text-white px-4 py-2 rounded-md"
            onClick={() => alert('Scale element clicked!')}
          >
            Scale Element
          </InteractiveElement>
          
          <InteractiveElement
            variant="highlight"
            className="bg-white border p-4 rounded-lg"
            onClick={() => alert('Highlight element clicked!')}
          >
            <h3 className="text-lg font-medium mb-2">Highlight Element</h3>
            <p>This element highlights on hover.</p>
          </InteractiveElement>
          
          <InteractiveElement
            variant="fade"
            className="bg-primary-100 text-primary-800 p-4 rounded-lg"
            onClick={() => alert('Fade element clicked!')}
          >
            <h3 className="text-lg font-medium mb-2">Fade Element</h3>
            <p>This element fades on hover.</p>
          </InteractiveElement>
        </div>
      </section>
      
      {/* Loading States Demo */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <Button onClick={() => setShowLoading(!showLoading)}>
            {showLoading ? 'Hide' : 'Show'} Loading States
          </Button>
        </div>
        
        <AnimatedTransition
          show={showLoading}
          variant="fadeIn"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-medium mb-4">Skeleton Loaders</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Text Skeletons</h4>
                  <div className="space-y-2">
                    <SkeletonLoader variant="text" width="100%" height={20} />
                    <SkeletonLoader variant="text" width="80%" height={20} />
                    <SkeletonLoader variant="text" width="90%" height={20} />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Card Skeleton</h4>
                  <CardSkeleton />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-medium mb-4">Table Skeleton</h3>
              <TableSkeleton rows={4} columns={3} />
            </div>
          </div>
        </AnimatedTransition>
      </section>
      
      {/* Code Examples */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Code Examples</h2>
        <div className="bg-neutral-50 p-4 rounded-lg border overflow-x-auto">
          <pre className="text-sm">
            {`// Using AnimatedContainer
<AnimatedContainer
  show={isVisible}
  variant="fadeIn"
  className="p-4 bg-white rounded"
>
  Content that animates in and out
</AnimatedContainer>

// Using InteractiveElement
<InteractiveElement
  variant="button"
  className="bg-primary-500 text-white px-4 py-2 rounded"
  onClick={handleClick}
>
  Interactive Button
</InteractiveElement>

// Using AnimatedList
<AnimatedList
  show={isVisible}
  variant="fadeIn"
  staggerDelay={0.1}
  className="space-y-2"
>
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</AnimatedList>

// Using PageTransition (on pages)
export default function MyPage() {
  return (
    <PageTransition variant="fade">
      <main>Page content</main>
    </PageTransition>
  );
}`}
          </pre>
        </div>
      </section>
    </PageTransition>
  );
}

// CSS for the toggle switch
const styles = `
.form-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch-toggle {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 34px;
  transition: .4s;
}

.switch-toggle:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: .4s;
}

input:checked + .switch-toggle:before {
  transform: translateX(26px);
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
} 