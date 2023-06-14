import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import { DistributionStateEnum } from "../enum/mod.ts";
import type {
  DistributionModel,
  FieldModel,
  GroupModel,
  UserModel,
} from "../model/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
import type { Node } from "../types.ts";
import { FieldNode, UserNode } from "./mod.ts";

export const GroupNode: Node<GroupModel> = new GraphQLObjectType({
  name: "Group",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    distribution: {
      type: new GraphQLNonNull(DistributionNode),
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
        const members = [];
        for (const memberId of memberIds) {
          const res = await kv.get<UserModel>(["user", memberId]);

          if (res.value === null) {
            throw new GraphQLError(`User with ID ${memberId} not found`);
          }

          members.push(res.value);
        }

        return members;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});

export const DistributionNode: Node<DistributionModel> = new GraphQLObjectType({
  name: "Distribution",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    state: {
      type: new GraphQLNonNull(DistributionStateEnum),
    },
    creator: {
      type: new GraphQLNonNull(UserNode),
      async resolve({ creatorId }, _args, { kv }) {
        const res = await kv.get<UserModel>(["user", creatorId]);

        if (res.value === null) {
          throw new GraphQLError(`User with ID ${creatorId} not found`);
        }

        return res.value;
      },
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fieldCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ fieldIds }) => fieldIds.length,
    },
    fields: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(FieldNode),
        ),
      ),
      async resolve({ fieldIds }, _args, { kv }) {
        const fields = [];
        for (const fieldId of fieldIds) {
          const res = await kv.get<FieldModel>(["field", fieldId]);

          if (res.value === null) {
            throw new GraphQLError(`Field with ID ${fieldId} not found`);
          }

          fields.push(res.value);
        }

        return fields;
      },
    },
    groupCount: {
      type: GraphQLInt,
      resolve: ({ groupIds }) => groupIds?.size,
    },
    groups: {
      type: new GraphQLList(
        new GraphQLNonNull(GroupNode),
      ),
      async resolve({ groupIds }, _args, { kv }) {
        if (groupIds == null) return null;

        const groups = [];
        for (const groupId of groupIds) {
          const res = await kv.get<GroupModel>(["group", groupId]);

          if (res.value === null) {
            throw new GraphQLError(`Group with ID ${groupId} not found`);
          }

          groups.push(res.value);
        }

        return groups;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});
