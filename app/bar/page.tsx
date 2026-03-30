"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { findByIngredients } from "@/lib/cosmic/engine";
import Link from "next/link";

const suggestions = [
  "Vodka", "Tequila", "Gin", "Rum", "Whiskey", "Bourbon",
  "Lime", "Lemon", "Orange juice", "Cranberry juice", "Pineapple juice",
  "Triple sec", "Simple syrup", "Sugar", "Ginger beer", "Soda water",
  "Mint", "Bitters", "Vermouth", "Coffee liqueur", "Cream",
  "Coconut cream", "Grenadine", "Prosecco", "Campari", "Aperol",
  "Cola", "Tomato juice", "Ginger ale",
];

export default function BarPage() {
  const [input, setInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!input.trim()) return [];
    const lower = input.toLowerCase();
    return suggestions
      .filter(
        (s) =>
          s.toLowerCase().includes(lower) &&
          !ingredients.includes(s)
      )
      .slice(0, 6);
  }, [input, ingredients]);

  function addIngredient(name: string) {
    if (!ingredients.includes(name)) {
      setIngredients([...ingredients, name]);
    }
    setInput("");
  }

  function removeIngredient(name: string) {
    setIngredients(ingredients.filter((i) => i !== name));
    setSearched(false);
  }

  const results = useMemo(() => {
    if (!searched || ingredients.length === 0) return [];
    return findByIngredients(ingredients);
  }, [searched, ingredients]);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-12 bg-radial-glow">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-champagne to-rose bg-clip-text text-transparent">
            What do you have?
          </h1>
          <p className="text-text-secondary">
            Add your ingredients and we&apos;ll find the best drinks you can make.
          </p>
        </div>

        {/* Input */}
        <div className="relative mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setSearched(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                addIngredient(input.trim());
              }
            }}
            placeholder="Type an ingredient..."
            className="w-full px-6 py-4 rounded-2xl glass-card text-text-primary placeholder-text-secondary text-lg focus:outline-none focus:border-amber/40 transition-colors"
          />
          <AnimatePresence>
            {filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-10"
              >
                {filteredSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => addIngredient(s)}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-text-primary hover:bg-[rgba(245,230,200,0.08)] transition-colors text-sm"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ingredient tags */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {ingredients.map((ing) => (
              <motion.span
                key={ing}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full pill-selected text-champagne text-sm font-medium"
              >
                {ing}
                <button
                  onClick={() => removeIngredient(ing)}
                  className="hover:text-rose transition-colors ml-1"
                >
                  &times;
                </button>
              </motion.span>
            ))}
          </div>
        )}

        {/* CTA */}
        {ingredients.length > 0 && (
          <button
            onClick={() => setSearched(true)}
            className="w-full py-4 rounded-2xl amber-gradient text-dark-bg font-bold text-lg shadow-lg shadow-amber/20 hover:shadow-amber/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 mb-8"
          >
            Find My Best Drink
          </button>
        )}

        {/* Results */}
        <AnimatePresence>
          {searched && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {results.map((r, i) => (
                <motion.div
                  key={r.drink.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{r.drink.emoji}</span>
                      <div>
                        <h3 className="text-lg font-bold text-champagne">{r.drink.name}</h3>
                        <p className="text-text-secondary text-sm">{r.drink.effort} effort</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[rgba(232,160,32,0.15)] border border-amber/30">
                      <span className="text-amber font-bold text-sm">{r.matchPercent}%</span>
                    </div>
                  </div>
                  {r.missingIngredients.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-text-secondary mb-1">Missing:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.missingIngredients.map((m) => (
                          <span
                            key={m}
                            className="px-2.5 py-1 rounded-full text-xs bg-[rgba(242,181,197,0.12)] text-rose border border-rose/20"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-[rgba(245,230,200,0.06)]">
                    <Link
                      href={`/result?mood=Chill&spirit=${r.drink.spirit[0] || ""}`}
                      className="text-amber text-sm hover:underline"
                    >
                      View full recipe &rarr;
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {searched && results.length === 0 && (
          <div className="text-center py-12 glass-card">
            <p className="text-text-secondary text-lg">No matching drinks found.</p>
            <p className="text-text-secondary text-sm mt-2">Try adding more ingredients!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
