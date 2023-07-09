import {
  aimap,
  amap,
  difference,
  filter,
  idifference,
  ifilter,
  ilimit,
  imap,
  limit,
  map,
  toArray,
} from "../utils/iter.ts";
import { assertEquals } from "./deps.ts";

function* gen() {
  yield 0;
  yield 1;
  yield 2;
  yield 3;
  yield 4;
  yield 5;
}

async function* agen() {
  yield 0;
  yield 1;
  yield 2;
  yield 3;
  yield 4;
  yield 5;
}

Deno.test("[utils/iter] imap", () => {
  const iter = imap((value) => value * 2, gen());

  assertEquals([...iter], [0, 2, 4, 6, 8, 10]);
});

Deno.test("[utils/iter] map", () => {
  const result = map((value) => value * 2, gen());

  assertEquals(result, [0, 2, 4, 6, 8, 10]);
});

Deno.test("[utils/iter] ifilter", () => {
  const iter = ifilter((value) => value % 2 === 0, gen());

  assertEquals([...iter], [0, 2, 4]);
});

Deno.test("[utils/iter] filter", () => {
  const result = filter((value) => value % 2 === 0, gen());

  assertEquals(result, [0, 2, 4]);
});

Deno.test("[utils/iter] idifference", () => {
  const minuend = new Set([0, 1, 2, 3, 4, 5]);
  const subtrahend = new Set([0, 1, 2]);

  const iter = idifference(minuend, subtrahend);

  assertEquals(new Set(iter), new Set([3, 4, 5]));
});

Deno.test("[utils/iter] difference", () => {
  const minuend = new Set([0, 1, 2, 3, 4, 5]);
  const subtrahend = new Set([0, 1, 2]);

  const result = difference(minuend, subtrahend);

  assertEquals(result, new Set([3, 4, 5]));
});

Deno.test("[utils/iter] ilimit", () => {
  const iter = ilimit(gen(), 3);

  assertEquals([...iter], [0, 1, 2]);
});

Deno.test("[utils/iter] limit", () => {
  const result = limit(gen(), 3);

  assertEquals(result, [0, 1, 2]);
});

Deno.test("[utils/iter] aimap", async () => {
  const aiter = aimap((value) => value * 2, agen());

  const result = [];
  for await (const value of aiter) result.push(value);

  assertEquals(result, [0, 2, 4, 6, 8, 10]);
});

Deno.test("[utils/iter] toArray", async () => {
  const aiter = agen();

  const result = await toArray(aiter);

  assertEquals(result, [0, 1, 2, 3, 4, 5]);
});

Deno.test("[utils/iter] amap", async () => {
  const result = await amap((value) => value * 2, agen());

  assertEquals(result, [0, 2, 4, 6, 8, 10]);
});
