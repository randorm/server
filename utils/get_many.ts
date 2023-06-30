import { GraphQLError } from "../deps.ts";
import { chunk, toArray } from "./mod.ts";

export const BATCH_SIZE = 10;

export async function* igetMany<T>(
  keys: Deno.KvKey[],
  kv: Deno.Kv,
  verdictor: (key: Deno.KvKey) => string,
): AsyncIterable<T> {
  const portions = chunk(keys, BATCH_SIZE);

  for (const portion of portions) {
    const batch = await kv.getMany<T[]>(portion);

    for (const entry of batch) {
      if (entry.value === null) {
        throw new GraphQLError(verdictor(entry.key));
      }

      yield entry.value;
    }
  }
}

export async function getMany<T>(
  keys: Deno.KvKey[],
  kv: Deno.Kv,
  verdictor: (key: Deno.KvKey) => string,
): Promise<T[]> {
  return await toArray(igetMany(keys, kv, verdictor));
}
