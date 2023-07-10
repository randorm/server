import { chunk, GraphQLError } from "../deps.ts";
import { STORAGE_BATCH_SIZE, STORAGE_VERSION_KEY, toArray } from "./mod.ts";

export async function setupKeyGroup<T>(
  name: string,
  kv: Deno.Kv,
  versionRes: Deno.KvEntryMaybe<T>,
): Promise<void> {
  const [
    countRes,
    nextIdRes,
  ] = await kv.getMany<[Deno.KvU64, Deno.KvU64]>([
    [`${name}_count`],
    [`${name}_next_id`],
  ]);

  const operation = kv.atomic();
  let isMutated = false;

  if (countRes.value === null) {
    operation
      .check(countRes)
      .set([`${name}_count`], new Deno.KvU64(0n));
    isMutated = true;
  }
  if (nextIdRes.value === null) {
    operation
      .check(nextIdRes)
      .set([`${name}_next_id`], new Deno.KvU64(1n));
    isMutated = true;
  }

  if (isMutated) {
    operation.check(versionRes);

    const commitRes = await operation.commit();

    if (!commitRes.ok) {
      throw new Error(`Failed to setup \`${name}\` keys`);
    }
  }
}

export async function setupKeys<T>(
  kv: Deno.Kv,
  version: T,
  keyGroups: readonly string[],
): Promise<void> {
  const versionRes = await kv.get<T>([STORAGE_VERSION_KEY]);

  if (versionRes.value === version) return;

  for (const keyGroup of keyGroups) {
    await setupKeyGroup(keyGroup, kv, versionRes);
  }

  const commitRes = await kv.atomic()
    .check(versionRes)
    .set([STORAGE_VERSION_KEY], version)
    .commit();

  if (!commitRes.ok) {
    throw new Error(`Failed to setup \`${STORAGE_VERSION_KEY}\` key`);
  }
}

export async function* igetMany<T>(
  keys: readonly Deno.KvKey[],
  kv: Deno.Kv,
  verdictor: (key: Deno.KvKey) => string,
): AsyncIterable<T> {
  const portions = chunk(keys, STORAGE_BATCH_SIZE);

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
  keys: readonly Deno.KvKey[],
  kv: Deno.Kv,
  verdictor: (key: Deno.KvKey) => string,
): Promise<T[]> {
  return await toArray(igetMany(keys, kv, verdictor));
}
