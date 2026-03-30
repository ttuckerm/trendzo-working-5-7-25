'use client';

import NetflixSidebar from './NetflixSidebar';
import NetflixHeader from './NetflixHeader';

export default function NetflixLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <NetflixSidebar />
      <div className="flex-1 pl-48">
        <NetflixHeader />
        <main className="pt-20 px-6 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
} 