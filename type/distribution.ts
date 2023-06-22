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

        const fieldKeySet = [...fieldIdsRes.value].map(
          (fieldId) => ["field", fieldId],
        );
        const fieldResSet = await kv.getMany<FieldModel[]>(fieldKeySet);

        const fields = [];
        for (const fieldRes of fieldResSet) {
          if (fieldRes.value === null) {
            const [_part, fieldId] = fieldRes.key;

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

        const fieldKeySet = [...fieldIdsRes.value].map(
          (fieldId) => ["field", fieldId],
        );
        const fieldResSet = await kv.getMany<FieldModel[]>(fieldKeySet);

        const fields = [];
        for (const fieldRes of fieldResSet) {
          if (fieldRes.value === null) {
            const [_part, fieldId] = fieldRes.key;

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

        const participantKeySet = [...participantIds].map(
          (userId) => ["user", userId],
        );
        const participantResSet = await kv.getMany<UserModel[]>(
          participantKeySet,
        );

        const participants = [];
        for (const participantRes of participantResSet) {
          if (participantRes.value === null) {
            const [_part, userId] = participantRes.key;

            throw new GraphQLError(`User with ID ${userId} not found`);
          }

          participants.push(participantRes.value);
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

        const fieldKeySet = [...fieldIdsRes.value].map(
          (fieldId) => ["field", fieldId],
        );
        const fieldResSet = await kv.getMany<FieldModel[]>(fieldKeySet);

        const fields = [];
        for (const fieldRes of fieldResSet) {
          if (fieldRes.value === null) {
            const [_part, fieldId] = fieldRes.key;

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

        const participantKeySet = [...participantIds].map(
          (userId) => ["user", userId],
        );
        const participantResSet = await kv.getMany<UserModel[]>(
          participantKeySet,
        );

        const participants = [];
        for (const participantRes of participantResSet) {
          if (participantRes.value === null) {
            const [_part, userId] = participantRes.key;

            throw new GraphQLError(`User with ID ${userId} not found`);
          }

          participants.push(participantRes.value);
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

        const groupKeySet = [...groupIdsRes.value].map(
          (groupId) => ["group", groupId],
        );
        const groupResSet = await kv.getMany<GroupModel[]>(groupKeySet);

        const groups = [];
        for (const groupRes of groupResSet) {
          if (groupRes.value === null) {
            const [_part, groupId] = groupRes.key;

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
