import React from 'react';
import { LandingNavbar } from '@/components/LandingNavbar';
import { LandingHero } from '@/components/LandingHero';
import { LandingFeatures } from '@/components/LandingFeatures';
import { LandingArchitecture } from '@/components/LandingArchitecture';
import { LandingPrivacy } from '@/components/LandingPrivacy';
import { LandingPricing } from '@/components/LandingPricing';
import { LandingFooter } from '@/components/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingArchitecture />
        <LandingPrivacy />
        <LandingPricing />
      </main>
      <LandingFooter />
    </div>
  );
}
