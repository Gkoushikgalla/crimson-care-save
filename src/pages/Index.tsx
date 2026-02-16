import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import BloodTypesSection from "@/components/home/BloodTypesSection";
import ComparisonSection from "@/components/home/ComparisonSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="overflow-x-hidden">
        <HeroSection />
        <FeaturesSection />
        <ComparisonSection />
        <HowItWorksSection />
        <BloodTypesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
