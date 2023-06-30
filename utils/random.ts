export function randomInt(lower: number, upper: number): number {
  return lower + Math.floor(Math.random() * (upper - lower + 1));
}

export function shuffle<T>(values: Iterable<T>): T[] {
  const shuffled = [...values];

  for (let i = 0; i < shuffled.length; i++) {
    const j = randomInt(0, shuffled.length - 1);

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function sample<T>(population: Iterable<T>, size: number): T[] {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("Sample size must be a positive integer");
  }

  return shuffle(population).slice(0, size);
}
