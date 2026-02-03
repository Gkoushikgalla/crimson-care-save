import { motion } from "framer-motion";
import { TrendingUp, Clock, Target, Users, Zap, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

const comparisonData = [
  { metric: "Response Time", crimsonCare: 95, traditional: 35, label: "95% faster" },
  { metric: "Match Accuracy", crimsonCare: 98, traditional: 72, label: "98% accurate" },
  { metric: "User Satisfaction", crimsonCare: 96, traditional: 68, label: "96% satisfied" },
  { metric: "SOS Success Rate", crimsonCare: 94, traditional: 52, label: "94% success" },
];

const keyMetrics = [
  {
    icon: Clock,
    value: "< 3 min",
    label: "Average Response Time",
    comparison: "vs 45+ min traditional",
    color: "text-emerald-500",
  },
  {
    icon: Target,
    value: "98%",
    label: "Match Accuracy",
    comparison: "AI-powered matching",
    color: "text-primary",
  },
  {
    icon: Users,
    value: "50K+",
    label: "Active Donors",
    comparison: "Growing community",
    color: "text-blue-500",
  },
  {
    icon: Zap,
    value: "24/7",
    label: "SOS Availability",
    comparison: "Real-time alerts",
    color: "text-amber-500",
  },
];

const features = [
  { feature: "Real-time SOS Alerts", crimsonCare: true, traditional: false },
  { feature: "AI Blood Matching", crimsonCare: true, traditional: false },
  { feature: "Gamification & Rewards", crimsonCare: true, traditional: false },
  { feature: "Multi-role Dashboards", crimsonCare: true, traditional: false },
  { feature: "Offline Support", crimsonCare: true, traditional: false },
  { feature: "Donation Tracking", crimsonCare: true, traditional: true },
];

const chartConfig = {
  crimsonCare: {
    label: "CrimsonCare",
    color: "hsl(var(--primary))",
  },
  traditional: {
    label: "Traditional Apps",
    color: "hsl(var(--muted-foreground))",
  },
};

const ComparisonSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The <span className="text-primary">CrimsonCare</span> Advantage
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how our AI-powered platform outperforms traditional blood donation systems
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {keyMetrics.map((metric, index) => (
            <Card
              key={index}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <CardContent className="p-6 text-center">
                <metric.icon className={`h-8 w-8 mx-auto mb-3 ${metric.color}`} />
                <div className="text-2xl md:text-3xl font-bold mb-1">{metric.value}</div>
                <div className="text-sm font-medium text-foreground mb-1">{metric.label}</div>
                <div className="text-xs text-muted-foreground">{metric.comparison}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Comparison Chart & Feature Table */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Bar Chart Comparison */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance Comparison
                </h3>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart
                    data={comparisonData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="metric" type="category" width={100} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="crimsonCare" name="CrimsonCare" radius={[0, 4, 4, 0]}>
                      {comparisonData.map((_, index) => (
                        <Cell key={`cell-crimson-${index}`} fill="hsl(var(--primary))" />
                      ))}
                    </Bar>
                    <Bar dataKey="traditional" name="Traditional Apps" radius={[0, 4, 4, 0]}>
                      {comparisonData.map((_, index) => (
                        <Cell key={`cell-trad-${index}`} fill="hsl(var(--muted-foreground) / 0.5)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-primary" />
                    <span className="text-sm text-muted-foreground">CrimsonCare</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-muted-foreground/50" />
                    <span className="text-sm text-muted-foreground">Traditional Apps</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Feature Comparison
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 pb-3 border-b border-border/50 text-sm font-medium">
                    <div>Feature</div>
                    <div className="text-center text-primary">CrimsonCare</div>
                    <div className="text-center text-muted-foreground">Others</div>
                  </div>
                  {features.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      viewport={{ once: true }}
                      className="grid grid-cols-3 gap-4 py-2 text-sm"
                    >
                      <div className="text-foreground">{item.feature}</div>
                      <div className="text-center">
                        {item.crimsonCare ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground">
                            ✗
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        {item.traditional ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground">
                            ✗
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">Lives Saved</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Partner Hospitals</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">4.9★</div>
              <div className="text-sm text-muted-foreground">User Rating</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
