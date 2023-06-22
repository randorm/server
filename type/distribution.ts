import {
  GraphQLEnumType,
  GraphQLError,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import type {
  DistributionModel,
  FieldModel,
  GroupModel,
  UserModel,
} from "../model/mod.ts";
import { DistributionState } from "../model/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
import type { Node } from "../types.ts";
import { FieldInterface, GroupNode, UserNode } from "./mod.ts";

export const DistributionStateEnum = new GraphQLEnumType({
  name: "DistributionState",
  values: {
    PREPARING: {
      value: "preparing",
    },
    GATHERING: {
      value: "gathering",
    },
    CLOSED: {
      value: "closed",
    },
  },
});

export const DistributionInterface = new GraphQLInterfaceType({
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
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fieldCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    fields: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(FieldInterface),
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
  resolveType({ state }) {
    switch (state) {
      case DistributionState.PREPARING:
        return "PreparingDistribution";
      case DistributionState.GATHERING:
        return "GatheringDistribution";
      case DistributionState.CLOSED:
        return "ClosedDistribution";
    }
  },
});

export const PreparingDistributionNode: Node<
  DistributionModel
> = new GraphQLObjectType({
  name: "PreparingDistribution",
  interfaces: [
    DistributionInterface,
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
    fieldCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["distribution:field_count", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Field count of Distribution with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    fields: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(FieldInterface),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const fieldIdsRes = await kv.get<Set<number>>([
          "distribution:field_ids",
          id,
        ]);

        if (fieldIdsRes.value === null) {
          throw new GraphQLError(
            `Field IDs of Distribution with ID ${id} not found`,
          );
        }

        const fields = [];
        for (const fieldId of fieldIdsRes.value) {
          const fieldRes = await kv.get<FieldModel>(["field", fieldId]);

          if (fieldRes.value === null) {
            throw new GraphQLError(`Field with ID ${fieldId} not found`);
          }

          fields.push(fieldRes.value);
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
  DistributionModel
> = new GraphQLObjectType({
  name: "GatheringDistribution",
  interfaces: [
    DistributionInterface,
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
    fieldCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["distribution:field_count", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Field count of Distribution with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    fields: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(FieldInterface),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const fieldIdsRes = await kv.get<Set<number>>([
          "distribution:field_ids",
          id,
        ]);

        if (fieldIdsRes.value === null) {
          throw new GraphQLError(
            `Field IDs of Distribution with ID ${id} not found`,
          );
        }

        const fields = [];
        for (const fieldId of fieldIdsRes.value) {
          const fieldRes = await kv.get<FieldModel>(["field", fieldId]);

          if (fieldRes.value === null) {
            throw new GraphQLError(`Field with ID ${fieldId} not found`);
          }

          fields.push(fieldRes.value);
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
        const [
          maleParticipantIdsRes,
          femaleParticipantIdsRes,
        ] = await kv.getMany<[
          Set<number>,
          Set<number>,
        ]>([
          ["distribution:male_participant_ids", id],
          ["distribution:male_participant_ids", id],
        ]);

        if (maleParticipantIdsRes.value === null) {
          throw new GraphQLError(
            `Male participant IDs of Distribution with ID ${id} not found`,
          );
        }
        if (femaleParticipantIdsRes.value === null) {
          throw new GraphQLError(
            `Female participant IDs of Distribution with ID ${id} not found`,
          );
        }

        const participantIds = new Set<number>([
          ...maleParticipantIdsRes.value,
          ...femaleParticipantIdsRes.value,
        ]);

        const participants = [];
        for (const participantId of participantIds) {
          const userRes = await kv.get<UserModel>(["user", participantId]);

          if (userRes.value === null) {
            throw new GraphQLError(`User with ID ${participantId} not found`);
          }

          participants.push(userRes.value);
        }

        return participants;
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
  DistributionModel
> = new GraphQLObjectType({
  name: "ClosedDistribution",
  interfaces: [
    DistributionInterface,
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
    fieldCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["distribution:field_count", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Field count of Distribution with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    fields: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(FieldInterface),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const fieldIdsRes = await kv.get<Set<number>>([
          "distribution:field_ids",
          id,
        ]);

        if (fieldIdsRes.value === null) {
          throw new GraphQLError(
            `Field IDs of Distribution with ID ${id} not found`,
          );
        }

        const fields = [];
        for (const fieldId of fieldIdsRes.value) {
          const fieldRes = await kv.get<FieldModel>(["field", fieldId]);

          if (fieldRes.value === null) {
            throw new GraphQLError(`Field with ID ${fieldId} not found`);
          }

          fields.push(fieldRes.value);
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
        const participantIdsRes = await kv.get<Set<number>>([
          "distribution:participant_ids",
          id,
        ]);

        if (participantIdsRes.value === null) {
          throw new GraphQLError(
            `Participants of Distribution with ID ${id} not found`,
          );
        }

        const participants = [];
        for (const participantId of participantIdsRes.value) {
          const userRes = await kv.get<UserModel>(["user", participantId]);

          if (userRes.value === null) {
            throw new GraphQLError(`User with ID ${participantId} not found`);
          }

          participants.push(userRes.value);
        }

        return participants;
      },
    },
    groupCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["distribution:group_count", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Group count of Distribution with ID ${id} not found`,
          );
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
      async resolve({ id }, _args, { kv }) {
        const groupIdsRes = await kv.get<Set<number>>([
          "distribution:group_ids",
          id,
        ]);

        if (groupIdsRes.value === null) {
          throw new GraphQLError(
            `Group IDs of Distribution with ID ${id} not found`,
          );
        }

        const groups = [];
        for (const groupId of groupIdsRes.value) {
          const groupRes = await kv.get<GroupModel>(["group", groupId]);

          if (groupRes.value === null) {
            throw new GraphQLError(`Group with ID ${groupId} not found`);
          }

          groups.push(groupRes.value);
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
