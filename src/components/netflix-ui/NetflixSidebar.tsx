'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, Heart, Calendar, Flame } from 'lucide-react';

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function SidebarNavItem({ href, icon, label, isActive }: SidebarNavItemProps) {
  return (
    <li className="mb-2">
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium ${
          isActive ? 'text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </Link>
    </li>
  );
}

export default function NetflixSidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-48 bg-black text-white">
      <div className="p-4">
        {/* Netflix Logo */}
        <Link href="/dashboard-view" className="block mb-8">
          <Image 
            src="/images/netflix-logo.svg" 
            alt="Netflix" 
            width={100} 
            height={30}
            className="h-8 w-auto"
            // Fallback to plain text if the image doesn't exist
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<span class="text-red-600 font-bold text-2xl">NETFLIX</span>';
              }
            }}
          />
        </Link>

        {/* Main Navigation */}
        <nav>
          <ul className="space-y-1">
            <SidebarNavItem
              href="/dashboard-view"
              icon={<Home size={18} />}
              label="Browse"
              isActive={pathname === '/dashboard-view'}
            />
            <SidebarNavItem
              href="/dashboard-view/wishlist"
              icon={<Heart size={18} />}
              label="Wishlist"
              isActive={pathname === '/dashboard-view/wishlist'}
            />
            <SidebarNavItem
              href="/dashboard-view/coming-soon"
              icon={<Calendar size={18} />}
              label="Coming Soon"
              isActive={pathname === '/dashboard-view/coming-soon'}
            />
          </ul>
        </nav>

        {/* Trailers Section */}
        <div className="mt-10">
          <h3 className="mb-4 text-sm font-medium">
            <span className="flex items-center gap-2">
              New Trailers <Flame size={16} className="text-red-500" />
            </span>
          </h3>
          <ul>
            <li className="mb-4">
              <div className="relative group cursor-pointer">
                <div className="rounded overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-800 relative">
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">Shadow and Bone</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-400" data-testid="trailer-title">Shadow and Bone</div>
              </div>
            </li>
            <li className="mb-4">
              <div className="relative group cursor-pointer">
                <div className="rounded overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-800 relative">
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">The Night Agent</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-400">The Night Agent</div>
              </div>
            </li>
            <li className="mb-4">
              <div className="relative group cursor-pointer">
                <div className="rounded overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-800 relative">
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">The Witcher</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-400">The Witcher</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
} 