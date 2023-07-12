import { GraphQLError } from "../../../deps.ts";
import type { ServerContext } from "../../../types.ts";
import { amap } from "../../../utils/mod.ts";
import type { GroupModel } from "../model/mod.ts";

export async function group(
  { kv }: ServerContext,
  { groupId }: { groupId: number },
) {
  const res = await kv.get<GroupModel>(["group", groupId]);

  if (res.value === null) {
    throw new GraphQLError(`Group with ID ${groupId} not found`);
  }

  return res.value;
}

export async function groupCount({ kv }: ServerContext): Promise<number> {
  const res = await kv.get<Deno.KvU64>(["group_count"]);

  if (res.value === null) {
    throw new GraphQLError("Group count not found");
  }

  return Number(res.value);
}

export async function groups({ kv }: ServerContext): Promise<GroupModel[]> {
  const iter = kv.list<GroupModel>({ prefix: ["group"] });

  return await amap(({ value }) => value, iter);
}
