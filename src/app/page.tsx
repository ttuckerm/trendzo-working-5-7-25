/**
 * CRITICAL FILE: Landing Page
 * 
 * PURPOSE: Renders the public marketing page at root URL (/)
 * 
 * WARNING:
 * - This file MUST serve the root URL (/)
 * - Do NOT redirect to dashboard or any other route
 * - Any changes to this file should NOT affect dashboard functionality
 */

"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, TrendingUp, Zap, Video, BarChart2, Globe, Star } from 'lucide-react';
import { PricingContainer } from '@/components/ui/PricingContainer';
import { PricingPlan } from '@/lib/types/pricingTypes';

export default function LandingPage() {
  const [videoHovered, setVideoHovered] = useState(false);
  
  // Define pricing plans
  const pricingPlans: PricingPlan[] = [
    {
      name: 'Basic',
      monthlyPrice: 0,
      yearlyPrice: 0,
      accent: 'bg-gradient-to-r from-gray-600 to-gray-800',
      features: [
        '10 template analyses per month',
        'Basic analytics dashboard',
        'Template library access'
      ],
      buttonText: 'Get Started'
    },
    {
      name: 'Premium',
      monthlyPrice: 29,
      yearlyPrice: 23,
      accent: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      features: [
        'Unlimited template analyses',
        'Advanced analytics and insights',
        'Template remix engine',
        'AI content suggestions',
        'Priority support'
      ],
      isPopular: true,
      buttonText: 'Get Premium'
    },
    {
      name: 'Business',
      monthlyPrice: 79,
      yearlyPrice: 63,
      accent: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      features: [
        'Everything in Premium',
        'Team collaboration',
        'API access',
        'Custom templates',
        'Dedicated account manager'
      ],
      buttonText: 'Contact Sales'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image 
                  src="/images/logos/trendzo-full-logo.svg" 
                  alt="Trendzo Logo" 
                  width={180}
                  height={50}
                  priority
                />
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6 text-sm">
              <Link href="/features" className="text-gray-600 hover:text-blue-600">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600">Pricing</Link>
              <Link href="/blog" className="text-gray-600 hover:text-blue-600">Blog</Link>
            </nav>
            
            <div className="flex items-center gap-3">
              <Link href="/auth" className="hidden sm:inline-block text-sm font-medium text-gray-700 hover:text-blue-600">
                Sign In
              </Link>
              <Link 
                href="/auth?signup=true"
                className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-blue-50 py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  Create TikTok content that <span className="text-blue-600">actually trends</span>
                </h1>
                <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                  Trendzo helps you analyze viral TikTok templates, remix them for your niche, and track your content performance—all in one place.
                </p>
                <div className="mt-8 flex gap-4">
                  <Link
                    href="/auth?signup=true"
                    className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Start for free
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    View Dashboard
                  </Link>
                </div>
                
                <div className="mt-6 flex items-center text-sm text-gray-500">
                  <Check className="mr-2 h-4 w-4 text-green-600" /> 
                  No credit card required
                </div>
              </div>
              
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                <div 
                  className="aspect-[4/3] bg-gray-100 relative"
                  onMouseEnter={() => setVideoHovered(true)}
                  onMouseLeave={() => setVideoHovered(false)}
                >
                  <Image
                    src="/dashboard-preview.png"
                    alt="Trendzo Dashboard Preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={`object-cover transition-opacity duration-300 ${videoHovered ? 'opacity-80' : 'opacity-100'}`}
                    priority
                  />
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${videoHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="rounded-full bg-blue-600 p-3 shadow-lg">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white" id="features">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">How Trendzo Works</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                Analyze trending TikTok templates, remix them for your brand, and track your performance—all in one platform.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Trend Analysis</h3>
                <p className="text-gray-600">
                  Discover viral TikTok templates with AI-powered analysis of structure, timing, and engagement metrics.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Template Remix</h3>
                <p className="text-gray-600">
                  Customize trending templates for your brand and content style with our intuitive remix engine.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Performance Tracking</h3>
                <p className="text-gray-600">
                  Track how your content performs with analytics that show what's working and why.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-gray-50" id="pricing">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <PricingContainer plans={pricingPlans} />
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">What Our Users Say</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                Thousands of creators use Trendzo to take their TikTok content to the next level.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">SJ</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Sarah Johnson</h4>
                    <p className="text-sm text-gray-500">Beauty Creator</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Trendzo helped me understand why my videos weren't getting views. After using their template analysis, my engagement increased by 300%!"
                </p>
                <div className="flex items-center mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star className="h-4 w-4 text-yellow-400" key={star} />
                  ))}
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">MT</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Mike Thomas</h4>
                    <p className="text-sm text-gray-500">Fitness Coach</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "The template remix feature is a game-changer. I can take what's trending and make it work for fitness content without starting from scratch."
                </p>
                <div className="flex items-center mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star className="h-4 w-4 text-yellow-400" key={star} />
                  ))}
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">LP</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Lisa Parker</h4>
                    <p className="text-sm text-gray-500">Small Business Owner</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "As a business owner, I don't have time to figure out TikTok. Trendzo made it simple and our products are now reaching a much wider audience."
                </p>
                <div className="flex items-center mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star className="h-4 w-4 text-yellow-400" key={star} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to create viral TikTok content?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of creators who are using Trendzo to analyze, remix, and track viral TikTok templates.
            </p>
            <Link
              href="/auth?signup=true"
              className="inline-block rounded-md bg-white px-6 py-3 text-base font-medium text-blue-600 shadow-sm hover:bg-blue-50"
            >
              Get Started for Free <ArrowRight className="inline ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link href="/features" className="text-gray-600 hover:text-blue-600">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-600 hover:text-blue-600">Pricing</Link></li>
                <li><Link href="/dashboard-view/template-library" className="text-gray-600 hover:text-blue-600">Templates</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><Link href="/blog" className="text-gray-600 hover:text-blue-600">Blog</Link></li>
                <li><Link href="/guides" className="text-gray-600 hover:text-blue-600">Guides</Link></li>
                <li><Link href="/support" className="text-gray-600 hover:text-blue-600">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-600 hover:text-blue-600">About</Link></li>
                <li><Link href="/careers" className="text-gray-600 hover:text-blue-600">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-gray-600 hover:text-blue-600">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-600 hover:text-blue-600">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Trendzo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
