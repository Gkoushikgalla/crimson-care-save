import { UserPlus, Search, Bell, Heart } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Register & Verify",
    description: "Create your account as a donor or hospital. Complete health verification for donors.",
  },
  {
    icon: Search,
    step: "02",
    title: "Find or Request",
    description: "Hospitals create blood requests. Our AI instantly matches compatible donors nearby.",
  },
  {
    icon: Bell,
    step: "03",
    title: "Get Notified",
    description: "Matched donors receive instant SMS and email alerts with request details.",
  },
  {
    icon: Heart,
    step: "04",
    title: "Save Lives",
    description: "Donors respond, donate blood, and earn rewards for their life-saving contribution.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            How <span className="text-gradient-crimson">CrimsonCare</span> Works
          </h2>
          <p className="text-lg text-muted-foreground">
            A simple 4-step process to connect donors with those in need
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Card */}
                <div className="relative z-10 flex flex-col items-center text-center p-6">
                  {/* Step Number */}
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-full bg-card border-2 border-primary flex items-center justify-center shadow-crimson">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-crimson text-primary-foreground text-sm font-bold flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
