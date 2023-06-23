export function randomInt(lower: number, upper: number): number {
  return lower + Math.floor(Math.random() * (upper - lower + 1));
}

export function shuffle<T>(values: T[]): T[] {
  const shuffled = [...values];

  for (let i = 0; i < shuffled.length; i++) {
    const j = randomInt(0, shuffled.length - 1);

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function sample<T>(population: T[], k: number): T[] {
  if (k <= 0) {
    throw new Error("Sample size must be positive");
  }

  return shuffle(population).slice(0, k);
}
