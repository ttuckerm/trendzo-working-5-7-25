"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
// Test another import to make sure case sensitivity isn't an issue
import { buttonVariants } from '@/components/ui/button';

export default function ButtonCaseTest() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Button Case Sensitivity Test</h1>
      
      <div className="space-y-4">
        <div>
          <p className="mb-2">Regular Button:</p>
          <Button>Test Button</Button>
        </div>
        
        <div>
          <p className="mb-2">Button with variants:</p>
          <div className="flex space-x-2">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>
        
        <div>
          <p className="mb-2">Button with buttonVariants:</p>
          <a className={buttonVariants({ variant: "outline" })}>
            Button as Anchor
          </a>
        </div>
      </div>
    </div>
  );
} 