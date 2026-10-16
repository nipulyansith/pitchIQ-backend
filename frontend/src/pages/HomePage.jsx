import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  BenefitsSection, CtaBanner, Hero, HowItWorksSection, PricingTeaser, TestimonialsSection,
} from '@/features/home/components';

export default function HomePage() {
  useDocumentTitle();
  return (
    <>
      <Hero />
      <HowItWorksSection />
      <BenefitsSection />
      <TestimonialsSection />
      <PricingTeaser />
      <CtaBanner />
    </>
  );
}
