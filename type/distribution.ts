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
import { getMany, map } from "../utils/mod.ts";
import { FieldInterface, GroupNode, UserNode } from "./mod.ts";

export const DistributionStateEnum = new GraphQLEnumType({
  name: "DistributionState",
  values: {
    PREPARING: {
      value: "preparing",
    },
    ANSWERING: {
      value: "answering",
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
  resolveType({ state }: DistributionModel) {
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
      async resolve({ creatorId }, _args, { kv }): Promise<UserModel> {
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
      async resolve({ id }, _args, { kv }): Promise<number> {
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
      async resolve({ id }, _args, { kv }): Promise<FieldModel[]> {
        const fieldIdsRes = await kv.get<Set<number>>([
          "distribution:field_ids",
          id,
        ]);

        if (fieldIdsRes.value === null) {
          throw new GraphQLError(
            `Field IDs of Distribution with ID ${id} not found`,
          );
        }

        const fields = await getMany<FieldModel>(
          map((fieldId) => ["field", fieldId], fieldIdsRes.value),
          kv,
          ([_part, fieldId]) => `Field with ID ${fieldId} not found`,
        );

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

export const AnsweringDistributionNode: Node<
  DistributionModel
> = new GraphQLObjectType({
  name: "AnsweringDistribution",
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
      async resolve({ creatorId }, _args, { kv }): Promise<UserModel> {
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
      async resolve({ id }, _args, { kv }): Promise<number> {
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
      async resolve({ id }, _args, { kv }): Promise<FieldModel[]> {
        const fieldIdsRes = await kv.get<Set<number>>([
          "distribution:field_ids",
          id,
        ]);

        if (fieldIdsRes.value === null) {
          throw new GraphQLError(
            `Field IDs of Distribution with ID ${id} not found`,
          );
        }

        const fields = await getMany<FieldModel>(
          map((fieldId) => ["field", fieldId], fieldIdsRes.value),
          kv,
          ([_part, fieldId]) => `Field with ID ${fieldId} not found`,
        );

        return fields;
      },
    },
    participantCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }): Promise<number> {
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
      async resolve({ id }, _args, { kv }): Promise<UserModel[]> {
        const [
          maleParticipantIdsRes,
          femaleParticipantIdsRes,
        ] = await kv.getMany<[Set<number>, Set<number>]>([
          ["distribution:male_participant_ids", id],
          ["distribution:female_participant_ids", id],
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

        const participants = await getMany<UserModel>(
          map((userId) => ["user", userId], participantIds),
          kv,
          ([_part, userId]) => `User with ID ${userId} not found`,
        );

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
      async resolve({ creatorId }, _args, { kv }): Promise<UserModel> {
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
      async resolve({ id }, _args, { kv }): Promise<number> {
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
      async resolve({ id }, _args, { kv }): Promise<FieldModel[]> {
        const fieldIdsRes = await kv.get<Set<number>>([
          "distribution:field_ids",
          id,
        ]);

        if (fieldIdsRes.value === null) {
          throw new GraphQLError(
            `Field IDs of Distribution with ID ${id} not found`,
          );
        }

        const fields = await getMany<FieldModel>(
          map((fieldId) => ["field", fieldId], fieldIdsRes.value),
          kv,
          ([_part, fieldId]) => `Field with ID ${fieldId} not found`,
        );

        return fields;
      },
    },
    participantCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }): Promise<number> {
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
      async resolve({ id }, _args, { kv }): Promise<UserModel[]> {
        const [
          maleParticipantIdsRes,
          femaleParticipantIdsRes,
        ] = await kv.getMany<[Set<number>, Set<number>]>([
          ["distribution:male_participant_ids", id],
          ["distribution:female_participant_ids", id],
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

        const participants = await getMany<UserModel>(
          map((userId) => ["user", userId], participantIds),
          kv,
          ([_part, userId]) => `User with ID ${userId} not found`,
        );

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
      async resolve({ creatorId }, _args, { kv }): Promise<UserModel> {
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
      async resolve({ id }, _args, { kv }): Promise<number> {
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
      async resolve({ id }, _args, { kv }): Promise<FieldModel[]> {
        const fieldIdsRes = await kv.get<Set<number>>([
          "distribution:field_ids",
          id,
        ]);

        if (fieldIdsRes.value === null) {
          throw new GraphQLError(
            `Field IDs of Distribution with ID ${id} not found`,
          );
        }

        const fields = await getMany<FieldModel>(
          map((fieldId) => ["field", fieldId], fieldIdsRes.value),
          kv,
          ([_part, fieldId]) => `Field with ID ${fieldId} not found`,
        );

        return fields;
      },
    },
    participantCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }): Promise<number> {
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
      async resolve({ id }, _args, { kv }): Promise<UserModel[]> {
        const [
          maleParticipantIdsRes,
          femaleParticipantIdsRes,
        ] = await kv.getMany<[Set<number>, Set<number>]>([
          ["distribution:male_participant_ids", id],
          ["distribution:female_participant_ids", id],
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

        const participants = await getMany<UserModel>(
          map((userId) => ["user", userId], participantIds),
          kv,
          ([_part, userId]) => `User with ID ${userId} not found`,
        );

        return participants;
      },
    },
    groupCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }): Promise<number> {
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
      async resolve({ id }, _args, { kv }): Promise<GroupModel[]> {
        const groupIdsRes = await kv.get<Set<number>>([
          "distribution:group_ids",
          id,
        ]);

        if (groupIdsRes.value === null) {
          throw new GraphQLError(
            `Group IDs of Distribution with ID ${id} not found`,
          );
        }

        const groups = await getMany<GroupModel>(
          map((groupId) => ["group", groupId], groupIdsRes.value),
          kv,
          ([_part, groupId]) => `Group with ID ${groupId} not found`,
        );

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
