import { chunk, GraphQLError } from "../deps.ts";
import { map } from "./mod.ts";

export const BATCH_SIZE = 10;

export async function getMany<T>(
  keys: Deno.KvKey[],
  kv: Deno.Kv,
  verdictor: (key: Deno.KvKey) => string,
): Promise<T[]> {
  const portions = chunk(keys, BATCH_SIZE);

  const entries = [];
  for (const portion of portions) {
    const batch = await kv.getMany<T[]>(portion);

    entries.push(...batch);
  }

  return map(
    (entry) => {
      if (entry.value === null) {
        const message = verdictor(entry.key);

        throw new GraphQLError(message);
      }

      return entry.value;
    },
    entries,
  );
}
