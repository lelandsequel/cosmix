"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const categories = [
  { label: "Mood", options: ["Chill", "Party", "Date", "Solo", "Fancy"] },
  { label: "Spirit", options: ["Vodka", "Tequila", "Whiskey", "Rum", "Gin", "None"] },
  { label: "Time", options: ["Day", "Night"] },
  { label: "Effort", options: ["Easy", "Medium", "Complex"] },
];

export default function Home() {
  const router = useRouter();
  const [selections, setSelections] = useState<Record<string, string[]>>({
    Mood: [],
    Spirit: [],
    Time: [],
    Effort: [],
  });

  function toggle(category: string, option: string) {
    setSelections((prev) => {
      const current = prev[category];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [category]: next };
    });
  }

  function handleRecommend() {
    const params = new URLSearchParams();
    for (const [key, values] of Object.entries(selections)) {
      if (values.length > 0) {
        params.set(key.toLowerCase(), values.join(","));
      }
    }
    router.push(`/result?${params.toString()}`);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-16 bg-radial-glow">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-2xl w-full text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-champagne via-rose to-amber bg-clip-text text-transparent">
          What do you feel like drinking?
        </h1>
        <p className="text-text-secondary mb-12 text-lg">
          Tell us your vibe and we&apos;ll find the perfect cocktail.
        </p>

        <div className="space-y-8">
          {categories.map((cat, catIdx) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 * catIdx }}
            >
              <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
                {cat.label}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {cat.options.map((opt) => {
                  const selected = selections[cat.label].includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggle(cat.label, opt)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                        selected
                          ? "pill-selected text-champagne"
                          : "pill-unselected text-text-secondary hover:text-text-primary hover:border-[rgba(245,230,200,0.25)]"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          onClick={handleRecommend}
          className="mt-12 px-10 py-4 rounded-2xl amber-gradient text-dark-bg font-bold text-lg shadow-lg shadow-amber/20 hover:shadow-amber/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Recommend My Drink
        </motion.button>
      </motion.div>
    </div>
  );
}
