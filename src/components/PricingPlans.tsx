import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    icon: Zap,
    accent: false,
    features: [
      "3 resume scans / month",
      "Basic ATS score",
      "View job listings",
      "Apply to 5 jobs / month",
      "Community support",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/ month",
    icon: Sparkles,
    accent: true,
    features: [
      "Unlimited resume scans",
      "AI-powered detailed feedback",
      "Priority job applications",
      "Apply to unlimited jobs",
      "Keyword optimization tips",
      "Email support",
    ],
    cta: "Upgrade to Pro",
  },
  {
    name: "Enterprise",
    price: "₹1,999",
    period: "/ month",
    icon: Crown,
    accent: false,
    features: [
      "Everything in Pro",
      "Recruiter dashboard access",
      "Post unlimited jobs",
      "AI screening questions",
      "Candidate ranking & analytics",
      "Dedicated account manager",
      "Custom integrations",
    ],
    cta: "Contact Sales",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const PricingPlans = () => {
  return (
    <section id="plans" className="py-24 px-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Choose your plan
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
            Start free, upgrade when you need more power. Every plan includes
            our core AI resume analysis.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                variants={item}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  plan.accent
                    ? "bg-foreground text-background shadow-2xl scale-[1.03] border-0"
                    : "bg-card border border-border shadow-sm"
                }`}
              >
                {plan.accent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      plan.accent
                        ? "bg-primary/20 text-primary"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3
                    className={`font-display font-semibold text-lg ${
                      plan.accent ? "text-background" : "text-foreground"
                    }`}
                  >
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-5">
                  <span
                    className={`text-3xl font-display font-bold ${
                      plan.accent ? "text-background" : "text-foreground"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ml-1 ${
                      plan.accent
                        ? "text-background/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          plan.accent ? "text-primary" : "text-primary"
                        }`}
                      />
                      <span
                        className={
                          plan.accent
                            ? "text-background/80"
                            : "text-muted-foreground"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold font-display transition-colors ${
                    plan.accent
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingPlans;
