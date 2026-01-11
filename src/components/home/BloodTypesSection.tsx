import { Droplets } from "lucide-react";

const bloodTypes = [
  { type: "A+", canDonateTo: ["A+", "AB+"], canReceiveFrom: ["A+", "A-", "O+", "O-"], prevalence: "35.7%" },
  { type: "O+", canDonateTo: ["O+", "A+", "B+", "AB+"], canReceiveFrom: ["O+", "O-"], prevalence: "37.4%" },
  { type: "B+", canDonateTo: ["B+", "AB+"], canReceiveFrom: ["B+", "B-", "O+", "O-"], prevalence: "8.5%" },
  { type: "AB+", canDonateTo: ["AB+"], canReceiveFrom: ["All Types"], prevalence: "3.4%" },
  { type: "A-", canDonateTo: ["A+", "A-", "AB+", "AB-"], canReceiveFrom: ["A-", "O-"], prevalence: "6.3%" },
  { type: "O-", canDonateTo: ["All Types"], canReceiveFrom: ["O-"], prevalence: "6.6%" },
  { type: "B-", canDonateTo: ["B+", "B-", "AB+", "AB-"], canReceiveFrom: ["B-", "O-"], prevalence: "1.5%" },
  { type: "AB-", canDonateTo: ["AB+", "AB-"], canReceiveFrom: ["AB-", "A-", "B-", "O-"], prevalence: "0.6%" },
];

const BloodTypesSection = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-6">
            <Droplets className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-accent-foreground">
              Blood Compatibility
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Know Your <span className="text-gradient-crimson">Blood Type</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Understanding blood type compatibility is crucial for safe transfusions
          </p>
        </div>

        {/* Blood Types Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {bloodTypes.map((blood, index) => (
            <div
              key={index}
              className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-crimson flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">
                    {blood.type}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Population</p>
                  <p className="text-sm font-semibold text-foreground">{blood.prevalence}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Can donate to:</p>
                  <div className="flex flex-wrap gap-1">
                    {blood.canDonateTo.slice(0, 3).map((type, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-xs bg-success/10 text-success font-medium"
                      >
                        {type}
                      </span>
                    ))}
                    {blood.canDonateTo.length > 3 && (
                      <span className="px-2 py-0.5 rounded text-xs bg-success/10 text-success font-medium">
                        +{blood.canDonateTo.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* O- Highlight */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="p-6 rounded-2xl bg-gradient-crimson-light border border-primary/20 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              🩸 O- is the Universal Donor
            </p>
            <p className="text-muted-foreground">
              O-negative blood can be given to anyone, making O- donors incredibly valuable in emergencies.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BloodTypesSection;
