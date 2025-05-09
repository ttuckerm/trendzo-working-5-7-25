"use client"

import Link from 'next/link'
import { 
  ArrowLeft, 
  BookOpen, 
  Sparkles,
  Wand2,
  Video,
  BarChart2,
  PenTool,
  Grid,
  Star,
  Users,
  Settings,
  CheckCircle,
  BookmarkPlus,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UserGuidePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>
      
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Trendzo User Guide</h1>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 mb-8">
        <div className="flex items-start gap-4">
          <Sparkles className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Welcome to Trendzo</h2>
            <p className="text-blue-800">
              Trendzo is your all-in-one content creation platform designed to help you create, optimize, 
              and analyze your content. This guide will walk you through all the features and 
              functionalities to help you make the most of Trendzo.
            </p>
          </div>
        </div>
      </div>
      
      {/* Table of Contents */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <a href="#getting-started" className="text-blue-600 hover:underline">Getting Started</a>
          </li>
          <li className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-blue-600" />
            <a href="#dashboard" className="text-blue-600 hover:underline">Dashboard</a>
          </li>
          <li className="flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-600" />
            <a href="#templates" className="text-blue-600 hover:underline">Templates</a>
          </li>
          <li className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-blue-600" />
            <a href="#editor" className="text-blue-600 hover:underline">Content Editor</a>
          </li>
          <li className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-blue-600" />
            <a href="#remix" className="text-blue-600 hover:underline">Template Remix</a>
          </li>
          <li className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <a href="#analytics" className="text-blue-600 hover:underline">Analytics</a>
          </li>
          <li className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <a href="#account" className="text-blue-600 hover:underline">Account Settings</a>
          </li>
        </ul>
      </div>
      
      <div className="grid gap-8 mb-12">
        {/* Getting Started */}
        <section id="getting-started">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Getting Started
          </h2>
          
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Creating Your Account</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>Sign up using your email or Google account</li>
              <li>Verify your email address through the link sent to your inbox</li>
              <li>Complete your profile by adding your name and content preferences</li>
              <li>Choose a subscription plan that fits your needs</li>
            </ol>
          </div>
          
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Subscription Tiers</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookmarkPlus className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold">Basic</h4>
                </div>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Access to template library</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Basic editor features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Limited analytics</span>
                  </li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                    <Star className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold">Premium</h4>
                </div>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Template Remix feature</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold">Business</h4>
                </div>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Everything in Premium</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Unlimited remixes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Custom branding</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Dashboard */}
        <section id="dashboard">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Grid className="w-6 h-6 text-blue-600" />
            Dashboard
          </h2>
          
          <div className="bg-white border rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Your dashboard is the central hub of Trendzo, providing quick access to all features and showing 
              key metrics at a glance.
            </p>
            
            <h3 className="text-lg font-semibold mb-3">Dashboard Sections</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Quick Links:</span> Access your most important features directly
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Stats:</span> View your template count and content performance
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Recent Activity:</span> See your recently modified templates
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Performance Trends:</span> Track how your content is performing
                </div>
              </li>
            </ul>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Pro Tip:</span> Customize your dashboard by pinning your most used templates for quick access.
              </p>
            </div>
          </div>
        </section>
        
        {/* Templates */}
        <section id="templates">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />
            Templates
          </h2>
          
          <div className="bg-white border rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Templates are pre-designed content frameworks that you can customize for your specific needs.
            </p>
            
            <h3 className="text-lg font-semibold mb-3">Working with Templates</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-medium">Creating a New Template</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Go to the Templates section and click "Create New Template." Choose a blank template 
                  or start from an existing one in our library.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-medium">Browsing the Template Library</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Explore trending templates, featured collections, and community favorites. Filter by category, 
                  style, or purpose to find the perfect template.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-medium">Saving Templates</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Click "Save Template" to add any template to your personal library. Organize them with tags 
                  for easy access later.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-medium">Template Versions</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Each template automatically saves version history. Access previous versions by clicking the 
                  "History" button on any template.
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/template-library">
                <Button variant="outline" className="gap-2">
                  <Grid className="w-4 h-4 mr-2" />
                  Browse Template Library
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Content Editor */}
        <section id="editor">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <PenTool className="w-6 h-6 text-blue-600" />
            Content Editor
          </h2>
          
          <div className="bg-white border rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              The content editor is where you'll customize templates and create your unique content.
            </p>
            
            <h3 className="text-lg font-semibold mb-3">Editor Features</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded p-3">
                <h4 className="font-medium mb-2">Drag-and-Drop Interface</h4>
                <p className="text-sm text-gray-600">
                  Easily rearrange text, media, and structural elements by dragging them to new positions.
                </p>
              </div>
              
              <div className="border rounded p-3">
                <h4 className="font-medium mb-2">Text Customization</h4>
                <p className="text-sm text-gray-600">
                  Format text with various styles, colors, fonts, and effects to match your brand identity.
                </p>
              </div>
              
              <div className="border rounded p-3">
                <h4 className="font-medium mb-2">Media Library</h4>
                <p className="text-sm text-gray-600">
                  Upload, store, and organize your images, videos, and audio files for easy access.
                </p>
              </div>
              
              <div className="border rounded p-3">
                <h4 className="font-medium mb-2">Element Gallery</h4>
                <p className="text-sm text-gray-600">
                  Choose from hundreds of design elements, animations, and effects to enhance your content.
                </p>
              </div>
              
              <div className="border rounded p-3">
                <h4 className="font-medium mb-2">Timeline View</h4>
                <p className="text-sm text-gray-600">
                  Precisely control the timing and animations of your content elements.
                </p>
              </div>
              
              <div className="border rounded p-3">
                <h4 className="font-medium mb-2">Preview Mode</h4>
                <p className="text-sm text-gray-600">
                  See exactly how your content will appear to viewers before publishing.
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-yellow-50 rounded-md border border-yellow-100">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Time-Saving Tip:</span> Use keyboard shortcuts (press ? in the editor to view all shortcuts) to speed up your workflow.
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/editor">
                <Button variant="outline" className="gap-2">
                  <PenTool className="w-4 h-4 mr-2" />
                  Open Editor
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Template Remix */}
        <section id="remix">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-blue-600" />
            Template Remix
          </h2>
          
          <div className="bg-white border rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Template Remix is our premium AI-powered feature that allows you to create variations of your templates.
            </p>
            
            <h3 className="text-lg font-semibold mb-3">Remix Types</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Structure Remix:</span> Reorganizes your content flow for better engagement
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Tone Remix:</span> Adjusts the voice and style to match different audiences
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Optimize Remix:</span> Comprehensive enhancement based on performance data
                </div>
              </li>
            </ul>
            
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Detailed Remix Documentation</h4>
                <p className="text-sm text-blue-700 mb-2">
                  We've created a comprehensive guide specifically for the Template Remix feature with step-by-step instructions, best practices, and examples.
                </p>
                <Link href="/remix-guide">
                  <Button variant="outline" className="gap-2 mt-1">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Template Remix Guide
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="mt-6 text-center space-y-3">
              <Link href="/remix">
                <Button variant="default" className="gap-2">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Try Template Remix
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Analytics */}
        <section id="analytics">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-600" />
            Analytics
          </h2>
          
          <div className="bg-white border rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Track and analyze the performance of your content to inform your strategy.
            </p>
            
            <h3 className="text-lg font-semibold mb-3">Analytics Features</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h4 className="font-medium">Performance Dashboard</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get a high-level overview of all your content performance metrics in one place.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h4 className="font-medium">Engagement Metrics</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Track views, likes, shares, comments, and retention rates across all your content.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h4 className="font-medium">Audience Insights</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Understand your audience demographics, geographic distribution, and viewing habits.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h4 className="font-medium">Template Comparison</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Compare performance across multiple templates to identify what works best.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h4 className="font-medium">Export Capabilities</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Export reports in various formats (CSV, PDF) for sharing with your team.
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/analytics">
                <Button variant="outline" className="gap-2">
                  <BarChart2 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Account Settings */}
        <section id="account">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Account Settings
          </h2>
          
          <div className="bg-white border rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Manage your account details, subscription, and preferences.
            </p>
            
            <h3 className="text-lg font-semibold mb-3">Account Management</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Profile Information:</span> Update your name, email, and profile picture
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Subscription Management:</span> Change plans, view billing history, update payment methods
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Notification Settings:</span> Control what notifications you receive
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Connected Accounts:</span> Link or unlink social media and other platforms
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="min-w-4 mt-1">•</div>
                <div>
                  <span className="font-medium">Security Settings:</span> Change password, enable two-factor authentication
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
      
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Need Further Assistance?</h2>
            <p className="text-gray-700 mb-4">
              If you need additional help or have specific questions not covered in this guide, please don't hesitate to reach out.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Support Center</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Browse our knowledge base for tutorials, FAQs, and troubleshooting guides.
                </p>
                <Link href="#">
                  <Button variant="outline" size="sm" className="w-full">Visit Support Center</Button>
                </Link>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Contact Support</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get in touch with our support team for personalized assistance.
                </p>
                <Link href="#">
                  <Button variant="outline" size="sm" className="w-full">Contact Support</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 