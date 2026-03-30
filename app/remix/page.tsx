"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { remix as remixDrink } from "@/lib/cosmic/engine";
import { cocktails } from "@/lib/cosmic/cocktails";

const goals = [
  { key: "better" as const, label: "Make it better", desc: "Premium upgrades & balance" },
  { key: "unique" as const, label: "Make it unique", desc: "Unexpected twists" },
  { key: "mine" as const, label: "Make it mine", desc: "Simplified & personalized" },
];

const flavorLabels = ["Sweet", "Bitter", "Citrus", "Strong", "Smooth"] as const;
const flavorKeys = ["sweet", "bitter", "citrus", "strong", "smooth"] as const;

function RemixContent() {
  const searchParams = useSearchParams();
  const initialDrink = searchParams.get("drink") || "";
  const [search, setSearch] = useState(initialDrink ? "" : "");
  const [selectedDrink, setSelectedDrink] = useState(initialDrink);
  const [selectedGoal, setSelectedGoal] = useState<"better" | "unique" | "mine" | null>(null);

  const filteredDrinks = useMemo(() => {
    if (!search.trim()) return [];
    const lower = search.toLowerCase();
    return cocktails
      .filter((c) => c.name.toLowerCase().includes(lower))
      .slice(0, 6);
  }, [search]);

  const result = useMemo(() => {
    if (!selectedDrink || !selectedGoal) return null;
    return remixDrink(selectedDrink, selectedGoal);
  }, [selectedDrink, selectedGoal]);

  const selectedCocktail = cocktails.find((c) => c.id === selectedDrink);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-12 bg-radial-glow">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-rose to-amber bg-clip-text text-transparent">
            Remix Lab
          </h1>
          <p className="text-text-secondary">
            Start with a classic. Make it yours.
          </p>
        </div>

        {/* Drink search */}
        {!selectedDrink && (
          <div className="relative mb-8">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a drink to remix..."
              className="w-full px-6 py-4 rounded-2xl glass-card text-text-primary placeholder-text-secondary text-lg focus:outline-none focus:border-amber/40 transition-colors"
            />
            <AnimatePresence>
              {filteredDrinks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-10"
                >
                  {filteredDrinks.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDrink(d.id);
                        setSearch("");
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-[rgba(245,230,200,0.08)] transition-colors flex items-center gap-3"
                    >
                      <span className="text-xl">{d.emoji}</span>
                      <span className="text-text-primary text-sm font-medium">{d.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Selected drink display */}
        {selectedCocktail && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 mb-6 text-center"
          >
            <span className="text-4xl block mb-2">{selectedCocktail.emoji}</span>
            <h2 className="text-xl font-bold text-champagne mb-1">{selectedCocktail.name}</h2>
            <p className="text-text-secondary text-sm">{selectedCocktail.reasoning}</p>
            <button
              onClick={() => {
                setSelectedDrink("");
                setSelectedGoal(null);
              }}
              className="mt-3 text-xs text-text-secondary hover:text-rose transition-colors"
            >
              Change drink
            </button>
          </motion.div>
        )}

        {/* Goal selection */}
        {selectedDrink && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-3 sm:grid-cols-3 mb-8"
          >
            {goals.map((g) => (
              <button
                key={g.key}
                onClick={() => setSelectedGoal(g.key)}
                className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                  selectedGoal === g.key
                    ? "pill-selected border-amber/40"
                    : "glass-card-light hover:border-[rgba(245,230,200,0.25)]"
                }`}
              >
                <p className={`font-bold text-sm mb-1 ${selectedGoal === g.key ? "text-amber" : "text-champagne"}`}>
                  {g.label}
                </p>
                <p className="text-text-secondary text-xs">{g.desc}</p>
              </button>
            ))}
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8"
            >
              <div className="text-center mb-6">
                <span className="text-4xl block mb-2">{result.modified.emoji}</span>
                <h2 className="text-2xl font-bold text-champagne">{result.modified.name}</h2>
              </div>

              {/* Delta explanation */}
              <div className="mb-6 p-4 rounded-xl bg-[rgba(232,160,32,0.08)] border border-amber/20">
                <p className="text-sm text-amber font-medium mb-1">What changed</p>
                <p className="text-text-primary text-sm">{result.delta}</p>
              </div>

              {/* Flavor comparison */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
                  Flavor Profile
                </h3>
                <div className="space-y-2">
                  {flavorKeys.map((key, i) => {
                    const orig = result.original.flavor[key];
                    const mod = result.modified.flavor[key];
                    const diff = mod - orig;
                    return (
                      <div key={key} className="flex items-center gap-3 text-sm">
                        <span className="w-16 text-text-secondary">{flavorLabels[i]}</span>
                        <div className="flex-1 h-2 rounded-full bg-[rgba(245,230,200,0.06)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber/60 to-amber"
                            style={{ width: `${mod * 10}%` }}
                          />
                        </div>
                        <span className="w-12 text-right">
                          {diff > 0 && <span className="text-amber">+{diff}</span>}
                          {diff < 0 && <span className="text-rose">{diff}</span>}
                          {diff === 0 && <span className="text-text-secondary">—</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
                  Ingredients
                </h3>
                <ul className="space-y-2">
                  {result.modified.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-baseline gap-2 text-sm">
                      <span className="text-champagne font-medium">{ing.amount}</span>
                      <span className="text-text-primary">{ing.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function RemixPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      }
    >
      <RemixContent />
    </Suspense>
  );
}
