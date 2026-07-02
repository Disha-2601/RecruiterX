import React from 'react';
import Navbar from '../components/home/Navbar';
import HeroSection from '../components/home/HeroSection';
import StatsStrip from '../components/home/StatsStrip';
import ProblemSection from '../components/home/ProblemSection';
import FeatureList from '../components/home/FeatureList';
import FeatureGrid from '../components/home/FeatureGrid';
import FAQSection from '../components/home/FAQSection';
import CTASection from '../components/home/CTASection';
import Footer from '../components/home/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0A14] selection:bg-[#0000FF] selection:text-white">
      <Navbar />
      <HeroSection />
      <StatsStrip />
      <ProblemSection />
      <FeatureList />
      <FeatureGrid />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
