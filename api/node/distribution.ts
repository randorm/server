import { resolve } from "https://deno.land/std@0.184.0/path/win32.ts";
import {
  GraphQLError,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "../deps.ts";
import { DistributionStateEnum } from "../enum/mod.ts";
import type {
  ClosedDistributionModel,
  DistributionModel,
  FieldModel,
  GatheringDistributionModel,
  GroupModel,
  PreparingDistributionModel,
  UserModel,
} from "../model/mod.ts";
import { DistributionStateModel } from "../model/mod.ts";
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

export const BaseDistributionInterface = new GraphQLInterfaceType({
  name: "BaseDistribution",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    state: {
      type: new GraphQLNonNull(DistributionStateEnum),
    },
    creator: {
      type: new GraphQLNonNull(UserNode),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fields: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(FieldNode),
        ),
      ),
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});

export const PreparingDistributionNode: Node<
  PreparingDistributionModel
> = new GraphQLObjectType({
  name: "PreparingDistribution",
  interfaces: [
    BaseDistributionInterface,
  ],
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
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});

export const GatheringDistributionNode: Node<
  GatheringDistributionModel
> = new GraphQLObjectType({
  name: "GatheringDistribution",
  interfaces: [
    BaseDistributionInterface,
  ],
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
    participantCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>([
          "distribution:participant_count",
          id,
        ]);

        if (res.value === null) {
          throw new GraphQLError(
            `Participant count of Distribution with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    participants: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Set<UserModel>>([
          "distribution:participants",
          id,
        ]);

        if (res.value === null) {
          throw new GraphQLError(
            `Participants of Distribution with ID ${id} not found`,
          );
        }

        return res.value;
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

export const ClosedDistributionNode: Node<
  ClosedDistributionModel
> = new GraphQLObjectType({
  name: "ClosedDistribution",
  interfaces: [
    BaseDistributionInterface,
  ],
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
    participantCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>([
          "distribution:participant_count",
          id,
        ]);

        if (res.value === null) {
          throw new GraphQLError(
            `Participant count of Distribution with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    participants: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Set<UserModel>>([
          "distribution:participants",
          id,
        ]);

        if (res.value === null) {
          throw new GraphQLError(
            `Participants of Distribution with ID ${id} not found`,
          );
        }

        return res.value;
      },
    },
    groupCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ groupIds }) => groupIds.size,
    },
    groups: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(GroupNode),
        ),
      ),
      async resolve({ groupIds }, _args, { kv }) {
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

export const DistributionNode = new GraphQLUnionType({
  name: "Distribution",
  types: [
    PreparingDistributionNode,
    GatheringDistributionNode,
    ClosedDistributionNode,
  ],
  resolveType({ state }) {
    switch (state) {
      case DistributionStateModel.PREPARING:
        return "PreparingDistribution";
      case DistributionStateModel.GATHERING:
        return "GatheringDistribution";
      case DistributionStateModel.CLOSED:
        return "ClosedDistribution";
    }
  },
});
