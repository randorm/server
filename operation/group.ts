import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from "../deps.ts";
import { GroupModel } from "../model/mod.ts";
import { GroupNode } from "../type/mod.ts";
import type { Operation } from "../types.ts";
import { amap } from "../utils/mod.ts";

export const GroupQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: {
    group: {
      type: new GraphQLNonNull(GroupNode),
      args: {
        groupId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        { groupId }: { groupId: number },
        { kv },
      ): Promise<GroupModel> {
        const res = await kv.get<GroupModel>(["group", groupId]);

        if (res.value === null) {
          throw new GraphQLError(`Group with ID ${groupId} not found`);
        }

        return res.value;
      },
    },
    groupCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, { kv }): Promise<number> {
        const res = await kv.get<Deno.KvU64>(["group_count"]);

        if (res.value === null) {
          throw new GraphQLError("Group count not found");
        }

        return Number(res.value);
      },
    },
    groups: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(GroupNode),
        ),
      ),
      async resolve(_root, _args, { kv }): Promise<GroupModel[]> {
        const iter = kv.list<GroupModel>({ prefix: ["group"] });

        return await amap(({ value }) => value, iter);
      },
    },
  },
});
