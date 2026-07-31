import { ShieldCheck, Zap, BadgePercent, Trash2, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

export function Features() {
  const items = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
      title: "Secure Processing",
      description: "All file communications are encrypted with SSL. Your files are processed securely and kept private at every stage.",
      gradient: "from-emerald-500/10 to-emerald-500/0",
      borderHover: "hover:border-emerald-500/30",
    },
    {
      icon: <Zap className="h-6 w-6 text-amber-500 animate-pulse" style={{ animationDuration: "3s" }} />,
      title: "Lightning Fast",
      description: "Get your unlocked PDFs in seconds. Our optimized decryption engine works instantly on your uploads.",
      gradient: "from-amber-500/10 to-amber-500/0",
      borderHover: "hover:border-amber-500/30",
    },
    {
      icon: <BadgePercent className="h-6 w-6 text-violet-500" />,
      title: "100% Free",
      description: "No hidden charges, no email registration, and no subscriptions. Unlock as many files as you need.",
      gradient: "from-violet-500/10 to-violet-500/0",
      borderHover: "hover:border-violet-500/30",
    },
    {
      icon: <Trash2 className="h-6 w-6 text-rose-500" />,
      title: "Auto Delete",
      description: "Your privacy is guaranteed. All uploaded files are permanently deleted from our servers within an hour.",
      gradient: "from-rose-500/10 to-rose-500/0",
      borderHover: "hover:border-rose-500/30",
    },
    {
      icon: <Smartphone className="h-6 w-6 text-sky-500" />,
      title: "Fully Responsive",
      description: "Access from anywhere. Our interface is designed to work beautifully on mobile, tablet, and desktop.",
      gradient: "from-sky-500/10 to-sky-500/0",
      borderHover: "hover:border-sky-500/30",
    },
  ];

  return (
    <section id="features" className="py-20 bg-muted/30 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-1/4 left-1/10 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/10 h-96 w-96 rounded-full bg-rose-500/5 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground mb-4">
            Designed for Speed and Security
          </h2>
          <p className="text-lg text-muted-foreground">
            We offer premium PDF unlocking capabilities without compromising your privacy or charging you a cent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto justify-items-stretch">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              className={`flex flex-col rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-8 shadow-sm transition-all duration-300 ${item.borderHover}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -6, boxShadow: "0 12px 30px -10px var(--shadow-color, rgba(0,0,0,0.08))" }}
            >
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} border border-border/50`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground flex-grow">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
