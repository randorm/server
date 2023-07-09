import { assert } from "./deps.ts";
import { randomInt, sample, shuffle } from "../utils/random.ts";

Deno.test("[utils/random] randomInt", () => {
  const min = 0;
  const max = 10;

  const int = randomInt(min, max);

  assert(min <= int && int <= max);
});

Deno.test("[utils/random] shuffle", () => {
  const iterable = [0, 1, 2, 3, 4, 5];

  const shuffled = shuffle(iterable);

  assert(shuffled.length === iterable.length);
  assert(shuffled.every((value) => iterable.includes(value)));
});

Deno.test("[utils/random] sample", () => {
  const iterable = [0, 1, 2, 3, 4, 5];

  const sampled = sample(iterable, 3);

  assert(sampled.length === 3);
  assert(sampled.every((value) => iterable.includes(value)));
});
