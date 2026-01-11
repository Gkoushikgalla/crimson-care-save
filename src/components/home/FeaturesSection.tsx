import { 
  Zap, 
  Shield, 
  MapPin, 
  Bell, 
  Award, 
  Activity,
  Heart,
  Users
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant SOS Alerts",
    description: "Send emergency blood requests that reach matching donors within seconds via SMS and email.",
  },
  {
    icon: Shield,
    title: "AI-Powered Matching",
    description: "Smart algorithm matches donors based on blood type compatibility, health status, and proximity.",
  },
  {
    icon: MapPin,
    title: "Location-Based Search",
    description: "Find donors within your specified radius using real-time GPS tracking and mapping.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Automated reminders for donation eligibility and health check updates.",
  },
  {
    icon: Award,
    title: "Rewards & Badges",
    description: "Earn points, badges, and recognition for your life-saving contributions.",
  },
  {
    icon: Activity,
    title: "Health Analytics",
    description: "Track your health metrics and donation history with detailed analytics.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-6">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-accent-foreground">
              Platform Features
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Smart Features for{" "}
            <span className="text-gradient-crimson">Life-Saving</span> Impact
          </h2>
          <p className="text-lg text-muted-foreground">
            Our AI-enabled platform connects donors with patients efficiently,
            ensuring no emergency goes unanswered.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="p-3 rounded-xl bg-gradient-crimson w-fit mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 p-6 rounded-2xl bg-gradient-crimson-light border border-primary/20">
            <Users className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-semibold text-foreground">
                Join 50,000+ donors making a difference
              </p>
              <p className="text-sm text-muted-foreground">
                Every donor helps save up to 3 lives
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
