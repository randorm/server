import { GraphQLError } from "../deps.ts";

export type Verdictor = (key: Deno.KvKey) => string;

export async function getMany<T>(
  keys: Deno.KvKey[],
  kv: Deno.Kv,
  verdictor: Verdictor,
): Promise<T[]> {
  const entryResSet = await kv.getMany<T[]>(keys);

  const entries = [];
  for (const entryRes of entryResSet) {
    if (entryRes.value === null) {
      throw new GraphQLError(verdictor(entryRes.key));
    }

    entries.push(entryRes.value);
  }

  return entries;
}
