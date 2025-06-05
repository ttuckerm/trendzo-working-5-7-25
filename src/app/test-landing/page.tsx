// Test page for landing page implementation
import LandingPageComponent from '@/components/mvp/LandingPage';

export default function TestLandingPage() {
  // Test with business/linkedin combination
  const testContent = {
    headline: "Executive Video Content That Gets You Promoted",
    subheadline: "Create professional videos that showcase your expertise in 60 seconds",
    painPoints: [
      "Struggling to stand out in a competitive market",
      "No time to learn complex video editing",
      "Need to build executive presence online"
    ],
    benefits: [
      "Get noticed by decision makers",
      "Position yourself as an industry leader", 
      "Save hours with done-for-you templates"
    ],
    ctaText: "Start Creating",
    socialProof: "Join 5,000+ executives building their brand",
    templateShowcase: "The Executive Insight format - 2M+ views average",
    urgencyText: "Templates updated weekly - get early access"
  };

  return (
    <LandingPageComponent
      niche="business"
      platform="linkedin"
      content={testContent}
    />
  );
}