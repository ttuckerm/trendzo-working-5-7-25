import { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Viral Laboratory Entry | CleanCopy',
  description: 'Enter the CleanCopy Viral Laboratory - Choose your path to viral content success',
  keywords: 'viral content, content creation, social media, video analysis, AI templates',
};

export default function ViralLabEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="viral-lab-entry-root">
      {children}
    </div>
  );
}