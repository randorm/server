import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from "../../../deps.ts";
import { getMany, map } from "../../../utils/mod.ts";
import type {
  DistributionModel,
  GroupModel,
  UserModel,
} from "../../database/model/mod.ts";
import { DateTimeScalar } from "../scalar/mod.ts";
import type { Node } from "../types.ts";
import { ClosedDistributionNode, UserNode } from "./mod.ts";

export const GroupNode: Node<GroupModel> = new GraphQLObjectType({
  name: "Group",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    distribution: {
      type: new GraphQLNonNull(ClosedDistributionNode),
      async resolve(
        { distributionId },
        _args,
        { kv },
      ): Promise<DistributionModel> {
        const res = await kv.get<DistributionModel>([
          "distribution",
          distributionId,
        ]);

        if (res.value === null) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} not found`,
          );
        }

        return res.value;
      },
    },
    memberCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ memberIds }): number => memberIds.size,
    },
    members: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ memberIds }, _args, { kv }): Promise<UserModel[]> {
        const members = await getMany<UserModel>(
          map((userId) => ["user", userId], memberIds),
          kv,
          ([_part, userId]) => `User with ID ${userId} not found`,
        );

        return members;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(DateTimeScalar),
    },
  }),
});
