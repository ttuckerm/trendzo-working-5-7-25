'use client';

import React from 'react';
import { CardHoverReveal, CardHoverRevealMain, CardHoverRevealContent } from './reveal-on-hover';

export const CardHoverRevealDemo = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
    {/* Product Showcase Card */}
    <CardHoverReveal className="h-[512px] w-full rounded-xl">
      <CardHoverRevealMain>
        <img
          width={1077}
          height={606}
          alt="Product showcase"
          src="https://images.unsplash.com/photo-1636247499734-893da2bcfc1c?q=80&w=2532&auto=format&fit=crop"
          className="inline-block size-full max-h-full max-w-full object-cover align-middle"
        />
      </CardHoverRevealMain>

      <CardHoverRevealContent className="space-y-4 rounded-2xl bg-zinc-900/75 text-zinc-50">
        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Services</h3>
          <div className="flex flex-wrap gap-2 ">
            <div className="rounded-full bg-zinc-800 px-2 py-1">
              <p className="text-xs leading-normal">E-commerce</p>
            </div>
            <div className="rounded-full bg-zinc-800 px-2 py-1">
              <p className="text-xs leading-normal">Product</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Features</h3>
          <div className="flex flex-wrap gap-2 ">
            <div className="rounded-full bg-[hsl(18,56%,32%)] px-2 py-1">
              <p className="text-xs leading-normal">AI Enhanced</p>
            </div>
            <div className="rounded-full bg-[hsl(18,56%,32%)] px-2 py-1">
              <p className="text-xs leading-normal">24 Suggestions</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Description</h3>
          <div className="flex flex-wrap gap-2 ">
            <p className="text-sm text-card">
              A clean, modern template for showcasing your products with style. Optimized for conversion and engagement.
            </p>
          </div>
        </div>
      </CardHoverRevealContent>
    </CardHoverReveal>

    {/* Tutorial Card */}
    <CardHoverReveal className="h-[512px] w-full rounded-xl">
      <CardHoverRevealMain>
        <img
          width={1077}
          height={606}
          alt="Tutorial template"
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&q=80"
          className="inline-block size-full max-h-full max-w-full object-cover align-middle"
        />
      </CardHoverRevealMain>

      <CardHoverRevealContent className="space-y-4 rounded-2xl bg-zinc-900/75 text-zinc-50">
        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Category</h3>
          <div className="flex flex-wrap gap-2 ">
            <div className="rounded-full bg-zinc-800 px-2 py-1">
              <p className="text-xs leading-normal">Education</p>
            </div>
            <div className="rounded-full bg-zinc-800 px-2 py-1">
              <p className="text-xs leading-normal">Tutorial</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Features</h3>
          <div className="flex flex-wrap gap-2 ">
            <div className="rounded-full bg-[hsl(18,56%,32%)] px-2 py-1">
              <p className="text-xs leading-normal">Step-by-step</p>
            </div>
            <div className="rounded-full bg-[hsl(18,56%,32%)] px-2 py-1">
              <p className="text-xs leading-normal">18 Suggestions</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Description</h3>
          <div className="flex flex-wrap gap-2 ">
            <p className="text-sm text-card">
              Step-by-step instructional template with optimal pacing. Perfect for how-to content and educational videos.
            </p>
          </div>
        </div>
      </CardHoverRevealContent>
    </CardHoverReveal>

    {/* Viral Story Card */}
    <CardHoverReveal className="h-[512px] w-full rounded-xl">
      <CardHoverRevealMain>
        <img
          width={1077}
          height={606}
          alt="Viral story template"
          src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&q=80"
          className="inline-block size-full max-h-full max-w-full object-cover align-middle"
        />
      </CardHoverRevealMain>

      <CardHoverRevealContent className="space-y-4 rounded-2xl bg-zinc-900/75 text-zinc-50">
        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Category</h3>
          <div className="flex flex-wrap gap-2 ">
            <div className="rounded-full bg-zinc-800 px-2 py-1">
              <p className="text-xs leading-normal">Entertainment</p>
            </div>
            <div className="rounded-full bg-zinc-800 px-2 py-1">
              <p className="text-xs leading-normal">Story</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Features</h3>
          <div className="flex flex-wrap gap-2 ">
            <div className="rounded-full bg-[hsl(18,56%,32%)] px-2 py-1">
              <p className="text-xs leading-normal">Emotional</p>
            </div>
            <div className="rounded-full bg-[hsl(18,56%,32%)] px-2 py-1">
              <p className="text-xs leading-normal">12 Suggestions</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Description</h3>
          <div className="flex flex-wrap gap-2 ">
            <p className="text-sm text-card">
              Narrative-driven emotional template with proven engagement. Perfect for storytelling and creating viral content.
            </p>
          </div>
        </div>
      </CardHoverRevealContent>
    </CardHoverReveal>
  </div>
); 