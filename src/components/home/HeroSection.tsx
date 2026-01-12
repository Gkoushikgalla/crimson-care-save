import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, ArrowRight, Droplets, Users, Clock } from "lucide-react";
import heroBloodBg from "@/assets/hero-blood-bg.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBloodBg})` }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-background/85 dark:bg-background/90" />
      </div>

      {/* Floating Blood Cells Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            <Droplets className="h-6 w-6 text-primary/20" />
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-8 animate-fade-in">
            <Heart className="h-4 w-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-accent-foreground">
              AI-Powered Blood Donation Platform
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 animate-slide-up">
            Every Drop{" "}
            <span className="text-gradient-crimson">Saves Lives</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Connect with donors instantly during emergencies. Our smart matching
            system ensures the right blood reaches the right patient at the right
            time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">
                Become a Donor
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/emergency">
                Emergency Request
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {[
              { icon: Users, value: "50,000+", label: "Registered Donors" },
              { icon: Droplets, value: "25,000+", label: "Successful Donations" },
              { icon: Clock, value: "< 30min", label: "Avg. Response Time" },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-3 rounded-xl bg-accent mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-primary" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
