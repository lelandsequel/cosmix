import { cocktails, Cocktail } from "./cocktails";

export interface UserPreferences {
  mood: string[];
  spirit: string[];
  time: string[];
  effort: string[];
}

export interface RecommendationResult {
  drink: Cocktail;
  confidence: number;
  reasoning: string;
  alternatives: { drink: Cocktail; confidence: number }[];
  signals: { signal: string; weight: number; score: number }[];
}

export interface BarResult {
  drink: Cocktail;
  matchPercent: number;
  missingIngredients: string[];
}

export interface RemixResult {
  original: Cocktail;
  modified: Cocktail;
  delta: string;
}

// --- Scoring helpers ---

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function flavorVector(f: Cocktail["flavor"]): number[] {
  return [f.sweet, f.bitter, f.citrus, f.strong, f.smooth];
}

function targetFlavorFromMood(moods: string[]): number[] {
  const profiles: Record<string, number[]> = {
    Chill:  [5, 2, 5, 3, 8],
    Party:  [7, 2, 6, 5, 5],
    Date:   [5, 3, 5, 5, 8],
    Solo:   [3, 5, 3, 7, 6],
    Fancy:  [4, 5, 4, 7, 7],
  };
  if (moods.length === 0) return [5, 3, 5, 5, 6];
  const avg = [0, 0, 0, 0, 0];
  let count = 0;
  for (const m of moods) {
    const p = profiles[m];
    if (p) {
      for (let i = 0; i < 5; i++) avg[i] += p[i];
      count++;
    }
  }
  if (count === 0) return [5, 3, 5, 5, 6];
  return avg.map((v) => v / count);
}

// --- Main recommendation engine ---

export function recommend(prefs: UserPreferences): RecommendationResult {
  const targetFlavor = targetFlavorFromMood(prefs.mood);

  const scored = cocktails.map((drink) => {
    let score = 0;
    let totalWeight = 0;
    const signals: { signal: string; weight: number; score: number }[] = [];

    // Flavor similarity (weight: 40)
    const flavorSim = cosineSimilarity(targetFlavor, flavorVector(drink.flavor));
    const flavorScore = Math.round(flavorSim * 100);
    signals.push({ signal: "Flavor Match", weight: 40, score: flavorScore });
    score += flavorScore * 40;
    totalWeight += 40;

    // Mood match (weight: 25)
    if (prefs.mood.length > 0) {
      const moodOverlap = prefs.mood.filter((m) => drink.mood.includes(m)).length;
      const moodScore = Math.round((moodOverlap / prefs.mood.length) * 100);
      signals.push({ signal: "Mood Alignment", weight: 25, score: moodScore });
      score += moodScore * 25;
      totalWeight += 25;
    }

    // Spirit match (weight: 20)
    if (prefs.spirit.length > 0) {
      const spiritMatch = prefs.spirit.some((s) => drink.spirit.includes(s));
      const spiritScore = spiritMatch ? 100 : 20;
      signals.push({ signal: "Spirit Preference", weight: 20, score: spiritScore });
      score += spiritScore * 20;
      totalWeight += 20;
    }

    // Time match (weight: 10)
    if (prefs.time.length > 0) {
      const timeMatch = prefs.time.some((t) => drink.time.includes(t));
      const timeScore = timeMatch ? 100 : 30;
      signals.push({ signal: "Time of Day", weight: 10, score: timeScore });
      score += timeScore * 10;
      totalWeight += 10;
    }

    // Effort match (weight: 5)
    if (prefs.effort.length > 0) {
      const effortScore = prefs.effort.includes(drink.effort) ? 100 : 40;
      signals.push({ signal: "Effort Level", weight: 5, score: effortScore });
      score += effortScore * 5;
      totalWeight += 5;
    }

    const confidence = totalWeight > 0 ? Math.round(score / totalWeight) : 50;

    return { drink, confidence: Math.min(99, Math.max(50, confidence)), signals };
  });

  scored.sort((a, b) => b.confidence - a.confidence);

  const top = scored[0];
  const alternatives = scored.slice(1, 4).map((s) => ({ drink: s.drink, confidence: s.confidence }));

  return {
    drink: top.drink,
    confidence: top.confidence,
    reasoning: top.drink.reasoning,
    alternatives,
    signals: top.signals,
  };
}

// --- Constraint solver (Bar page) ---

const ingredientAliases: Record<string, string[]> = {
  vodka: ["vodka"],
  tequila: ["tequila"],
  gin: ["gin"],
  rum: ["rum", "white rum", "dark rum"],
  whiskey: ["bourbon", "rye whiskey", "whiskey", "irish whiskey", "blended scotch", "islay scotch"],
  bourbon: ["bourbon", "rye whiskey"],
  lime: ["lime", "lime juice", "lime wedge"],
  lemon: ["lemon", "lemon juice", "lemon peel"],
  "simple syrup": ["simple syrup", "sugar", "sugar cube", "brown sugar"],
  sugar: ["simple syrup", "sugar", "sugar cube"],
  "triple sec": ["triple sec", "cointreau", "orange curaçao"],
  "ginger beer": ["ginger beer"],
  "soda water": ["soda water", "club soda"],
  mint: ["mint", "mint leaves"],
  "orange juice": ["orange juice"],
  "cranberry juice": ["cranberry juice"],
  "coffee liqueur": ["coffee liqueur", "kahlúa"],
  cream: ["heavy cream", "cream"],
  bitters: ["angostura bitters", "peychaud's bitters"],
  vermouth: ["sweet vermouth", "dry vermouth"],
  "coconut cream": ["coconut cream"],
  "pineapple juice": ["pineapple juice"],
  grenadine: ["grenadine"],
  prosecco: ["prosecco", "champagne", "sparkling wine"],
  cola: ["cola"],
  "tomato juice": ["tomato juice"],
  "ginger ale": ["ginger ale"],
  campari: ["campari"],
  aperol: ["aperol"],
};

function normalizeIngredient(name: string): string[] {
  const lower = name.toLowerCase().trim();
  return ingredientAliases[lower] || [lower];
}

export function findByIngredients(userIngredients: string[]): BarResult[] {
  const normalizedUser = new Set<string>();
  for (const ing of userIngredients) {
    for (const alias of normalizeIngredient(ing)) {
      normalizedUser.add(alias.toLowerCase());
    }
  }

  const results: BarResult[] = [];

  for (const drink of cocktails) {
    const required = drink.ingredients.map((i) => i.name.toLowerCase());
    const matched = required.filter((r) => normalizedUser.has(r));
    const missing = required.filter((r) => !normalizedUser.has(r));

    // Filter out garnishes from missing count
    const essentialMissing = missing.filter(
      (m) =>
        !m.includes("garnish") &&
        !m.includes("twist") &&
        !m.includes("wedge") &&
        !m.includes("slice") &&
        !m.includes("cherry") &&
        !m.includes("salt") &&
        !m.includes("pepper") &&
        !m.includes("nutmeg") &&
        !m.includes("celery") &&
        m !== "olive or lemon twist"
    );

    const total = required.length;
    const matchPercent = total > 0 ? Math.round(((total - essentialMissing.length) / total) * 100) : 0;

    if (matchPercent >= 50) {
      results.push({
        drink,
        matchPercent: Math.min(100, matchPercent),
        missingIngredients: essentialMissing,
      });
    }
  }

  results.sort((a, b) => b.matchPercent - a.matchPercent);
  return results.slice(0, 10);
}

// --- Remix engine ---

type RemixGoal = "better" | "unique" | "mine";

export function remix(drinkId: string, goal: RemixGoal): RemixResult | null {
  const original = cocktails.find((c) => c.id === drinkId);
  if (!original) return null;

  const modified: Cocktail = JSON.parse(JSON.stringify(original));
  let delta = "";

  switch (goal) {
    case "better": {
      // Boost the dominant flavor slightly, improve balance
      const fv = modified.flavor;
      const max = Math.max(fv.sweet, fv.bitter, fv.citrus, fv.strong, fv.smooth);
      if (fv.smooth < 7) { fv.smooth = Math.min(10, fv.smooth + 2); }
      if (max === fv.sweet && fv.bitter < 4) { fv.bitter = Math.min(10, fv.bitter + 1); }
      modified.name = `${original.name} (Enhanced)`;
      modified.ingredients = modified.ingredients.map((i) => {
        if (i.substitution) return { ...i, name: i.substitution, substitution: i.name };
        return i;
      });
      delta = `Upgraded to premium substitutions and balanced the flavor profile for a more refined experience. Boosted smoothness and added complexity.`;
      break;
    }
    case "unique": {
      // Twist the flavor profile
      modified.flavor.citrus = Math.min(10, modified.flavor.citrus + 2);
      modified.flavor.bitter = Math.min(10, modified.flavor.bitter + 1);
      modified.name = `${original.name} (Twisted)`;
      const twists = ["Add 2 dashes of aromatic bitters", "Add 1/4 oz elderflower liqueur", "Add a bar spoon of amaro"];
      const twist = twists[Math.floor(Math.abs(original.id.charCodeAt(0)) % twists.length)];
      modified.ingredients.push({ name: twist.replace("Add ", ""), amount: "as noted" });
      delta = `${twist} to create an unexpected flavor dimension. Increased citrus and bitterness for a more adventurous profile.`;
      break;
    }
    case "mine": {
      // Simplify and make more approachable
      modified.flavor.sweet = Math.min(10, modified.flavor.sweet + 1);
      modified.flavor.strong = Math.max(0, modified.flavor.strong - 1);
      modified.name = `${original.name} (Personalized)`;
      modified.effort = "Easy";
      modified.ingredients = modified.ingredients.filter((_, i) => i < 4);
      delta = `Simplified the recipe for easier preparation. Softened the strength and added a touch more sweetness for a more approachable drink.`;
      break;
    }
  }

  return { original, modified, delta };
}

// --- Variation adjustments for result page ---

export function applyVariation(drink: Cocktail, variation: string): { drink: Cocktail; explanation: string } {
  const modified: Cocktail = JSON.parse(JSON.stringify(drink));
  let explanation = "";

  switch (variation) {
    case "stronger":
      modified.flavor.strong = Math.min(10, modified.flavor.strong + 2);
      modified.flavor.smooth = Math.max(0, modified.flavor.smooth - 1);
      modified.name = `${drink.name} (Strong)`;
      modified.ingredients = modified.ingredients.map((i) => {
        if (i.name.toLowerCase().includes("rum") || i.name.toLowerCase().includes("vodka") ||
            i.name.toLowerCase().includes("gin") || i.name.toLowerCase().includes("whiskey") ||
            i.name.toLowerCase().includes("tequila") || i.name.toLowerCase().includes("bourbon") ||
            i.name.toLowerCase().includes("scotch") || i.name.toLowerCase().includes("cognac")) {
          return { ...i, amount: i.amount.replace(/[\d.]+/, (m) => String(Math.round(parseFloat(m) * 1.5 * 10) / 10)) };
        }
        return i;
      });
      explanation = "Increased spirit portions by 50% for a bolder, more spirit-forward experience.";
      break;
    case "smoother":
      modified.flavor.smooth = Math.min(10, modified.flavor.smooth + 2);
      modified.flavor.strong = Math.max(0, modified.flavor.strong - 2);
      modified.flavor.sweet = Math.min(10, modified.flavor.sweet + 1);
      modified.name = `${drink.name} (Smooth)`;
      explanation = "Dialed back the strength and added sweetness for a silkier, more approachable sip.";
      break;
    case "cheaper":
      modified.name = `${drink.name} (Budget)`;
      modified.ingredients = modified.ingredients.map((i) => {
        if (i.substitution) return { ...i, name: i.substitution, substitution: i.name };
        return i;
      });
      explanation = "Swapped premium ingredients for accessible alternatives without sacrificing the core flavor profile.";
      break;
    case "impressive":
      modified.name = `${drink.name} (Showstopper)`;
      modified.flavor.bitter = Math.min(10, modified.flavor.bitter + 1);
      modified.ingredients.push({ name: "Edible flower or gold leaf", amount: "for garnish" });
      explanation = "Added a visual garnish element and refined the complexity for maximum wow factor.";
      break;
    default:
      explanation = "No changes applied.";
  }

  return { drink: modified, explanation };
}
