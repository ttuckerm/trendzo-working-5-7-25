"use client"

import Link from 'next/link'
import { 
  ArrowLeft, 
  Wand2, 
  Sparkles, 
  Zap, 
  Copy, 
  BarChart, 
  RefreshCw,
  Star,
  ArrowRight,
  CheckCircle,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RemixGuidePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        
        <Link href="/user-guide" className="flex items-center text-blue-600 hover:text-blue-800">
          <BookOpen className="w-4 h-4 mr-2" /> Main User Guide
        </Link>
      </div>
      
      <div className="flex items-center gap-3 mb-8">
        <Wand2 className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Template Remix Guide</h1>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 mb-8">
        <div className="flex items-start gap-4">
          <Sparkles className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Unlock Creative Template Variations</h2>
            <p className="text-blue-800">
              The Template Remix feature lets you create endless variations of your successful templates,
              each optimized for different goals, audiences, or content styles. Boost your engagement
              by testing different approaches and finding what works best for your audience.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-8 mb-12">
        <section>
          <h2 className="text-2xl font-bold mb-4">Getting Started with Template Remix</h2>
          <p className="text-gray-600 mb-6">
            Template Remix is a premium feature that allows you to create AI-powered variations of your templates.
            Each variation is designed to target specific improvements while maintaining the core message of your content.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="border rounded-lg p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">1</div>
                <h3 className="font-semibold">Select a Template</h3>
              </div>
              <p className="text-sm text-gray-600">
                Start by selecting a template from your library or the Trendzo template marketplace.
                Choose templates that are performing well but could use optimization.
              </p>
            </div>
            
            <div className="border rounded-lg p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">2</div>
                <h3 className="font-semibold">Choose Remix Type</h3>
              </div>
              <p className="text-sm text-gray-600">
                Select a remix type based on what you want to improve. Each type focuses on different
                aspects of your template to enhance.
              </p>
            </div>
            
            <div className="border rounded-lg p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">3</div>
                <h3 className="font-semibold">Review & Save</h3>
              </div>
              <p className="text-sm text-gray-600">
                Review the AI-generated template variation, make any needed adjustments, 
                and save it to your variations library.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mb-4">
            <Link href="/remix">
              <Button variant="default" className="gap-2">
                <Wand2 className="w-4 h-4 mr-2" />
                Go to Remix Studio
              </Button>
            </Link>
            <Link href="/variations">
              <Button variant="outline" className="gap-2">
                <Copy className="w-4 h-4 mr-2" />
                View My Variations
              </Button>
            </Link>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold mb-4">Remix Types Explained</h2>
          <p className="text-gray-600 mb-6">
            Template Remix offers three different approaches to optimize your templates, each focusing on different aspects:
          </p>
          
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Wand2 className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Structure Remix</h3>
                  <p className="text-gray-600 mb-3">
                    Optimizes the sequence, timing, and organization of your template sections to improve
                    viewer retention and engagement.
                  </p>
                  <h4 className="font-medium mb-1">Best For:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Templates with viewer drop-off issues</li>
                    <li>Content that needs better pacing</li>
                    <li>Templates with too many or too few sections</li>
                  </ul>
                  <div className="mt-3 text-sm text-gray-500">
                    <span className="font-medium">Performance Impact:</span> Typically improves retention by 5-15%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Zap className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tone Remix</h3>
                  <p className="text-gray-600 mb-3">
                    Adjusts the language, style, and emotional tone of your template to better connect
                    with specific audiences or brand personalities.
                  </p>
                  <h4 className="font-medium mb-1">Best For:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Experimenting with different brand voices</li>
                    <li>Targeting specific demographic groups</li>
                    <li>Adjusting formality level for different platforms</li>
                  </ul>
                  <div className="mt-3 text-sm text-gray-500">
                    <span className="font-medium">Performance Impact:</span> Typically improves audience connection by 3-10%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <RefreshCw className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Optimize Remix</h3>
                  <p className="text-gray-600 mb-3">
                    Comprehensively enhances your template by applying multiple optimization strategies based
                    on trend data and performance analytics.
                  </p>
                  <h4 className="font-medium mb-1">Best For:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Underperforming templates that need a complete refresh</li>
                    <li>Templates you want to align with current trends</li>
                    <li>Preparing content for high-stakes campaigns</li>
                  </ul>
                  <div className="mt-3 text-sm text-gray-500">
                    <span className="font-medium">Performance Impact:</span> Typically improves overall engagement by 8-20%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold mb-4">Advanced Remix Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <BarChart className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Performance Predictions</h3>
              </div>
              <p className="text-sm text-gray-600">
                Each remix comes with AI-generated performance predictions, showing you the expected
                engagement lift and which metrics should improve. These predictions are based on
                historical template performance data and industry benchmarks.
              </p>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <Star className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Promote to Template</h3>
              </div>
              <p className="text-sm text-gray-600">
                When you find a variation that performs exceptionally well, you can promote it to
                become a standalone template in your library. This allows you to use it as a base
                for future content or share it with your team.
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3 text-yellow-800">
              <Sparkles className="w-5 h-5" />
              Premium Tier Required
            </h3>
            <p className="text-yellow-700 mb-4">
              Template Remix features are available exclusively to Premium and Business tier subscribers.
              Each tier includes a specific number of remixes per month.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/pricing" className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800">
                View Pricing <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold mb-4">Step-by-Step Tutorial</h2>
          
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">1</div>
              <div>
                <h3 className="font-semibold mb-1">Navigate to Remix Studio</h3>
                <p className="text-gray-600 text-sm">
                  From your dashboard, click on "Template Remix" in the sidebar or visit <Link href="/remix" className="text-blue-600 hover:underline">/remix</Link> directly.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">2</div>
              <div>
                <h3 className="font-semibold mb-1">Select a Template</h3>
                <p className="text-gray-600 text-sm">
                  Browse your templates or the template marketplace. Click on the template you want to remix.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">3</div>
              <div>
                <h3 className="font-semibold mb-1">Choose a Remix Type</h3>
                <p className="text-gray-600 text-sm">
                  Select from Structure, Tone, or Optimize remix types based on your goals.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">4</div>
              <div>
                <h3 className="font-semibold mb-1">Add Specific Instructions (Optional)</h3>
                <p className="text-gray-600 text-sm">
                  Provide additional guidance for the AI, such as "Make it more energetic" or "Optimize for Gen Z audience."
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">5</div>
              <div>
                <h3 className="font-semibold mb-1">Generate Remix</h3>
                <p className="text-gray-600 text-sm">
                  Click "Generate Remix" and wait while our AI creates your template variation.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">6</div>
              <div>
                <h3 className="font-semibold mb-1">Review and Edit</h3>
                <p className="text-gray-600 text-sm">
                  Review the generated variation, make any needed adjustments to text, timing, or structure.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">7</div>
              <div>
                <h3 className="font-semibold mb-1">Save Variation</h3>
                <p className="text-gray-600 text-sm">
                  Give your variation a name and description, then click "Save Variation" to add it to your variations library.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">8</div>
              <div>
                <h3 className="font-semibold mb-1">Access Your Variations</h3>
                <p className="text-gray-600 text-sm">
                  View all your saved variations by going to <Link href="/variations" className="text-blue-600 hover:underline">/variations</Link>. From there, you can edit, 
                  delete, or promote variations to full templates.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/remix">
              <Button size="lg" className="gap-2">
                <Wand2 className="w-5 h-5 mr-2" />
                Try Template Remix Now
              </Button>
            </Link>
          </div>
        </section>
      </div>
      
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Best Practices for Successful Remixes</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-gray-400 mt-2"></div>
                <p>Start with templates that already have some performance data for better predictions</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-gray-400 mt-2"></div>
                <p>Be specific in your additional instructions to guide the AI more effectively</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-gray-400 mt-2"></div>
                <p>Create multiple variations with different remix types to test different approaches</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-gray-400 mt-2"></div>
                <p>Always review and fine-tune AI-generated variations before publishing</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-gray-400 mt-2"></div>
                <p>Track performance data for your variations to see which remix types work best for your content</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 