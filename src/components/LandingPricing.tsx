'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

export const LandingPricing: React.FC = () => {
  const tiers = [
    {
      name: 'Developer / Demo',
      price: '$0',
      period: 'forever free',
      description: 'Ideal for local development, hackathon demos, and individual testing.',
      features: [
        'Deterministic In-Memory Qdrant adapter',
        'Lyzr 5-Agent workflow simulator',
        'Omi webhook & event simulator',
        'Seed memories & timeline delta detection',
        'Basic privacy scope filtering',
      ],
      cta: 'Launch Free Demo',
      href: '/dashboard',
      popular: false,
    },
    {
      name: 'Team Copilot',
      price: '$29',
      period: 'per workspace / month',
      description: 'Designed for engineering squads needing continuous meeting memory.',
      features: [
        'Live Qdrant Cloud vector cluster sync',
        'Real-time Omi hardware webhook streams',
        'Lyzr Agent Cloud multi-agent orchestration',
        'Automated timeline delta notifications',
        'Full retention policies (30d, 7d, forever)',
        'Evidence citations with source timestamps',
      ],
      cta: 'Start Team Trial',
      href: '/login',
      popular: true,
    },
    {
      name: 'Enterprise Shield',
      price: '$99',
      period: 'per workspace / month',
      description: 'Advanced governance for regulated teams with executive confidentiality.',
      features: [
        'Role-based privacy isolation & audit logs',
        'Zero-retention ephemeral memory mode',
        'Automatic PII & API credential scrubbing',
        'Dedicated Qdrant hybrid vector index',
        'Custom Lyzr multi-agent skill definitions',
        'Priority 24/7 SLA & compliance support',
      ],
      cta: 'Contact Enterprise',
      href: '/login',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 border-t border-slate-800/80 bg-slate-950/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/60 text-sky-300 border border-sky-800/80 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Pricing Plans
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Transparent plans for every team.
          </h2>
          <p className="text-base text-slate-400">
            Start immediately in Demo Mode with zero credit card or external credentials required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between border relative transition duration-300 ${
                tier.popular
                  ? 'bg-slate-900/90 border-sky-500/80 shadow-2xl shadow-sky-500/10 ring-1 ring-sky-500/40'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[11px] font-bold tracking-wide uppercase shadow">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-xs text-slate-400 mb-6">{tier.description}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white tracking-tight">{tier.price}</span>
                  <span className="text-xs text-slate-500">/{tier.period}</span>
                </div>

                <div className="space-y-3 mb-8">
                  {tier.features.map((feat, fidx) => (
                    <div key={fidx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <div className="p-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={tier.href}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition ${
                  tier.popular
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <span>{tier.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
