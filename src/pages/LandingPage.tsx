import React from 'react';
import { HeroBanner } from '../components/landing/HeroBanner';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { ComparisonSection } from '../components/landing/ComparisonSection';
import { FeatureBanners } from '../components/landing/FeatureBanners';
import { UseCasesSection } from '../components/landing/UseCasesSection';
import { PricingSection } from '../components/landing/PricingSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { FaqSection } from '../components/landing/FaqSection';
import { FinalCtaBanner } from '../components/landing/FinalCtaBanner';

export default function LandingPage() {
  return (
    <div className="space-y-12 sm:space-y-16 py-4 sm:py-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* 1. Hero Big Impact Banner */}
      <HeroBanner />

      {/* 2. Cara Kerja 3 Langkah Mudah */}
      <div id="cara-kerja">
        <HowItWorksSection />
      </div>

      {/* 3. Before vs After Comparison */}
      <ComparisonSection />

      {/* 4. Feature Showcase Banners */}
      <div id="fitur">
        <FeatureBanners />
      </div>

      {/* 5. Supported Business Segments */}
      <UseCasesSection />

      {/* 6. Pricing Section */}
      <div id="harga">
        <PricingSection />
      </div>

      {/* 7. Testimoni Pedagang Nyata */}
      <div id="testimoni">
        <TestimonialsSection />
      </div>

      {/* 8. FAQ Accordion */}
      <div id="faq">
        <FaqSection />
      </div>

      {/* 9. Final Conversion Banner */}
      <FinalCtaBanner />

      {/* 10. Footer */}
      <footer className="border-t border-slate-200 pt-8 pb-6 text-center text-xs text-slate-500 space-y-2">
        <div className="font-bold text-slate-800 text-sm">
          KASIR<span className="text-amber-700">KITA</span> • Solusi Kasir Pintar & Modern
        </div>
        <p>Dirancang dengan standar modern untuk memajukan bisnis kafe dan UMKM Indonesia.</p>
        <p className="text-[11px] text-slate-400">© {new Date().getFullYear()} KASIRKITA. Seluruh hak cipta dilindungi undang-undang.</p>
      </footer>
    </div>
  );
}
