import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, ArrowRight, AlertTriangle } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Donor CTA */}
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-crimson text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 mb-6">
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">For Donors</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Ready to Save Lives?
              </h3>
              <p className="text-primary-foreground/80 mb-8 max-w-md">
                Join our community of heroes. Register as a donor today and be notified
                when someone needs your blood type in your area.
              </p>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/register">
                  Register as Donor
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Hospital CTA */}
          <div className="p-8 md:p-12 rounded-3xl bg-card border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent mb-6">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-accent-foreground">For Hospitals</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                Need Blood Urgently?
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md">
                Create emergency blood requests and reach thousands of verified donors
                instantly. Our AI matches the right donors for your needs.
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/register?role=hospital">
                  Register Hospital
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
