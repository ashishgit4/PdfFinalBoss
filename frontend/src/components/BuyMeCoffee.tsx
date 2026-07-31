import { Coffee } from "lucide-react";
import { motion } from "framer-motion";

export const BUY_ME_COFFEE_URL = "#";

export function BuyMeCoffee() {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1 }}
    >
      <motion.a
        href={BUY_ME_COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 rounded-full bg-amber-500 hover:bg-amber-400 px-4.5 py-3 text-sm font-bold text-stone-900 shadow-xl shadow-amber-500/20 transition-colors border border-amber-600/10 cursor-pointer"
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{
          scale: 1.08,
          boxShadow: "0 20px 25px -5px rgb(245 158 11 / 0.3), 0 8px 10px -6px rgb(245 158 11 / 0.3)",
        }}
        whileTap={{ scale: 0.95 }}
      >
        <Coffee className="h-5 w-5 text-stone-900 fill-stone-900/10" />
        <span className="hidden sm:inline">Buy Me a Coffee</span>
      </motion.a>
    </motion.div>
  );
}
