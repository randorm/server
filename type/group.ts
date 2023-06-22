import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from "../deps.ts";
import type { DistributionModel, GroupModel, UserModel } from "../model/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
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
      async resolve({ distributionId }, _args, { kv }) {
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
    members: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ memberIds }, _args, { kv }) {
        const memberKeySet = [...memberIds].map(
          (memberId) => ["user", memberId],
        );
        const memberResSet = await kv.getMany<UserModel[]>(memberKeySet);

        const members = [];
        for (const memberRes of memberResSet) {
          if (memberRes.value === null) {
            const [_part, userId] = memberRes.key;

            throw new GraphQLError(`User with ID ${userId} not found`);
          }

          members.push(memberRes.value);
        }

        return members;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});
