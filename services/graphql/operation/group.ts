import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from "../../../deps.ts";
import { GroupModel } from "../../database/model/mod.ts";
import { group, groupCount, groups } from "../../database/operation/mod.ts";
import { GroupNode } from "../type/mod.ts";
import type { Operation } from "../types.ts";

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
        args: { groupId: number },
        context,
      ): Promise<GroupModel> {
        return await group(context, args);
      },
    },
    groupCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, context): Promise<number> {
        return await groupCount(context);
      },
    },
    groups: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(GroupNode),
        ),
      ),
      async resolve(_root, _args, context): Promise<GroupModel[]> {
        return await groups(context);
      },
    },
  },
});
