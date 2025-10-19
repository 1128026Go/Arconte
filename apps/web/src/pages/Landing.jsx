/**
 * Arconte Landing Page
 *
 * Página principal pública que muestra todas las funcionalidades
 * y convierte visitantes en usuarios registrados.
 *
 * Estructura:
 * - Navbar (sticky con blur)
 * - Hero Section con LoginCard
 * - Social Proof Bar
 * - Features Grid (3x3)
 * - Demo Section
 * - How It Works (timeline)
 * - AI Section (Gemini destacado)
 * - Pricing (Free vs Pro vs Firma vs Enterprise)
 * - Testimonials (carousel)
 * - Trust Signals
 * - Final CTA
 * - Footer
 *
 * @author Arconte Team
 * @date 2025-10-18
 */

import { useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import SocialProofBar from '../components/landing/SocialProofBar';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import HowItWorks from '../components/landing/HowItWorks';
import AISection from '../components/landing/AISection';
import PricingSection from '../components/landing/PricingSection';
import Footer from '../components/landing/Footer';

export default function Landing() {
  useEffect(() => {
    // Scroll to top al montar
    window.scrollTo(0, 0);

    // Set page title
    document.title = 'Arconte - Asistente Jurídico Inteligente | IA para Abogados en Colombia';
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Social Proof Bar */}
      <SocialProofBar />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* How It Works */}
      <HowItWorks />

      {/* AI Section */}
      <AISection />

      {/* Pricing */}
      <PricingSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
