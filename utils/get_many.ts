import { GraphQLError } from "../deps.ts";
import { map } from "./mod.ts";

export async function getMany<T>(
  keys: Deno.KvKey[],
  kv: Deno.Kv,
  verdictor: (key: Deno.KvKey) => string,
): Promise<T[]> {
  const entries = await kv.getMany<T[]>(keys);

  return map(
    (entry) => {
      if (entry.value === null) {
        throw new GraphQLError(verdictor(entry.key));
      }

      return entry.value;
    },
    entries,
  );
}
