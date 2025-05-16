'use client';

import React from 'react';
import { CardHoverRevealDemo } from '@/components/ui/reveal-on-hover-demo';

export default function HoverCardDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Hover Reveal Card Demo</h1>
        <p className="text-gray-600">
          Cards with hidden content that reveals on hover. This component enhances the user experience by showing additional information when hovering over template cards.
        </p>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4">Implementation Details</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>CardHoverReveal</strong> - Main container component that tracks hover state
          </li>
          <li>
            <strong>CardHoverRevealMain</strong> - Content that's always visible with optional scale effect
          </li>
          <li>
            <strong>CardHoverRevealContent</strong> - Content that's revealed on hover
          </li>
        </ul>
      </div>
      
      <CardHoverRevealDemo />

      <div className="mt-12 bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Usage Example</h2>
        <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
{`<CardHoverReveal className="h-[350px] w-full rounded-xl">
  <CardHoverRevealMain>
    <Image
      src="/image.jpg"
      alt="Template image"
      fill
      className="object-cover"
    />
  </CardHoverRevealMain>

  <CardHoverRevealContent className="bg-zinc-900/75 text-zinc-50 p-6">
    <div className="space-y-2">
      <h3 className="text-sm">Category</h3>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs">
          Education
        </span>
      </div>
    </div>

    <div className="space-y-2 mt-4">
      <h3 className="text-sm">Description</h3>
      <p className="text-sm">
        Template description goes here...
      </p>
    </div>
  </CardHoverRevealContent>
</CardHoverReveal>`}
        </pre>
      </div>
    </div>
  );
} 