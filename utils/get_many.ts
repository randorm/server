import { chunk, GraphQLError } from "../deps.ts";

const BATCH_SIZE = 10;

export async function getMany<T>(
  keys: Deno.KvKey[],
  kv: Deno.Kv,
  verdictor: (key: Deno.KvKey) => string,
): Promise<T[]> {
  const portions = chunk(keys, BATCH_SIZE);

  const values = [];
  for (const portion of portions) {
    const batch = await kv.getMany<T[]>(portion);

    for (const entry of batch) {
      if (entry.value === null) {
        throw new GraphQLError(verdictor(entry.key));
      }

      values.push(entry.value);
    }
  }

  return values;
}
