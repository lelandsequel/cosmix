"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recommend, applyVariation, type RecommendationResult } from "@/lib/cosmic/engine";
import type { Cocktail } from "@/lib/cosmic/cocktails";
import Link from "next/link";

const flavorLabels = ["Sweet", "Bitter", "Citrus", "Strong", "Smooth"] as const;
const flavorKeys = ["sweet", "bitter", "citrus", "strong", "smooth"] as const;
const variations = [
  { key: "stronger", label: "Make it stronger" },
  { key: "smoother", label: "Make it smoother" },
  { key: "cheaper", label: "Make it cheaper" },
  { key: "impressive", label: "Make it more impressive" },
];

function FlavorPill({ label, value }: { label: string; value: number }) {
  const intensity = value >= 7 ? "text-amber" : value >= 4 ? "text-champagne" : "text-text-secondary";
  return (
    <span className={`glass-card-light px-3 py-1.5 text-xs font-medium ${intensity}`}>
      {label} {value}/10
    </span>
  );
}

function DrinkCard({
  drink,
  confidence,
  reasoning,
  signals,
}: {
  drink: Cocktail;
  confidence: number;
  reasoning: string;
  signals: RecommendationResult["signals"];
}) {
  const [activeVariation, setActiveVariation] = useState<string | null>(null);
  const [showCosmic, setShowCosmic] = useState(false);

  const displayed = useMemo(() => {
    if (!activeVariation) return { drink, explanation: "" };
    return applyVariation(drink, activeVariation);
  }, [drink, activeVariation]);

  const d = displayed.drink;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl w-full mx-auto"
    >
      {/* Hero card */}
      <div className="glass-card p-8 mb-6">
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block">{d.emoji}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-champagne mb-2">{d.name}</h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(232,160,32,0.15)] border border-amber/30">
            <span className="text-amber font-bold text-lg">{confidence}%</span>
            <span className="text-text-secondary text-sm">match</span>
          </div>
        </div>

        {/* Flavor pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {flavorKeys.map((key, i) => (
            <FlavorPill key={key} label={flavorLabels[i]} value={d.flavor[key]} />
          ))}
        </div>

        {/* Why this works */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            Why This Works
          </h2>
          <p className="text-text-primary leading-relaxed">
            {reasoning}
            {displayed.explanation && (
              <span className="text-rose"> {displayed.explanation}</span>
            )}
          </p>
        </div>

        {/* Ingredients */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
            Ingredients
          </h2>
          <ul className="space-y-2">
            {d.ingredients.map((ing, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="text-champagne font-medium">{ing.amount}</span>
                <span className="text-text-primary">{ing.name}</span>
                {ing.substitution && (
                  <span className="text-text-secondary text-sm">
                    (or {ing.substitution})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Variations */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
            Variations
          </h2>
          <div className="flex flex-wrap gap-2">
            {variations.map((v) => (
              <button
                key={v.key}
                onClick={() =>
                  setActiveVariation(activeVariation === v.key ? null : v.key)
                }
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  activeVariation === v.key
                    ? "pill-selected text-champagne"
                    : "pill-unselected text-text-secondary hover:text-text-primary"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* COSMIC Panel */}
        <div>
          <button
            onClick={() => setShowCosmic(!showCosmic)}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showCosmic ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            COSMIC Signal Breakdown
          </button>
          <AnimatePresence>
            {showCosmic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <table className="w-full mt-4 text-sm">
                  <thead>
                    <tr className="text-text-secondary text-left">
                      <th className="pb-2 font-medium">Signal</th>
                      <th className="pb-2 font-medium text-center">Weight</th>
                      <th className="pb-2 font-medium text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((s) => (
                      <tr key={s.signal} className="border-t border-[rgba(245,230,200,0.06)]">
                        <td className="py-2 text-text-primary">{s.signal}</td>
                        <td className="py-2 text-center text-text-secondary">{s.weight}%</td>
                        <td className="py-2 text-right">
                          <span className={s.score >= 70 ? "text-amber" : s.score >= 40 ? "text-champagne" : "text-rose"}>
                            {s.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl glass-card-light text-text-secondary hover:text-text-primary font-medium text-sm transition-colors"
        >
          New Drink
        </Link>
        <Link
          href={`/remix?drink=${d.id}`}
          className="px-6 py-3 rounded-xl glass-card-light text-champagne font-medium text-sm transition-colors hover:bg-[rgba(245,230,200,0.12)]"
        >
          Remix This
        </Link>
      </div>
    </motion.div>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();

  const result = useMemo(() => {
    const prefs = {
      mood: searchParams.get("mood")?.split(",").filter(Boolean) || [],
      spirit: searchParams.get("spirit")?.split(",").filter(Boolean) || [],
      time: searchParams.get("time")?.split(",").filter(Boolean) || [],
      effort: searchParams.get("effort")?.split(",").filter(Boolean) || [],
    };
    return recommend(prefs);
  }, [searchParams]);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-12 bg-radial-glow">
      <DrinkCard
        drink={result.drink}
        confidence={result.confidence}
        reasoning={result.reasoning}
        signals={result.signals}
      />

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto mt-10"
        >
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4 text-center">
            Also Consider
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {result.alternatives.map((alt) => (
              <div key={alt.drink.id} className="glass-card-light p-4 text-center">
                <span className="text-2xl block mb-1">{alt.drink.emoji}</span>
                <p className="text-text-primary font-medium text-sm">{alt.drink.name}</p>
                <p className="text-text-secondary text-xs mt-1">{alt.confidence}% match</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <p className="text-text-secondary">Mixing your drink...</p>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
