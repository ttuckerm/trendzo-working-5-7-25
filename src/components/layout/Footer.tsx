import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/trendzo-logo.svg" 
                alt="Trendzo Logo" 
                width={120}
                height={36}
                priority
              />
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              Advanced TikTok template analysis and tracking
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Navigation
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-purple-600">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/template-library" className="text-gray-600 hover:text-purple-600">
                    Template Library
                  </Link>
                </li>
                <li>
                  <Link href="/admin/template-analyzer" className="text-gray-600 hover:text-purple-600">
                    Template Analyzer
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Resources
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/docs" className="text-gray-600 hover:text-purple-600">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-600 hover:text-purple-600">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-gray-600 hover:text-purple-600">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Trendzo. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 