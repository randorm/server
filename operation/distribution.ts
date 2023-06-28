import { distribute } from "../algorithms/mod.ts";
import { assertDistribution, assertEditor } from "../assert/mod.ts";
import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import type { DistributionModel, FieldModel } from "../model/mod.ts";
import { DistributionState, Gender } from "../model/mod.ts";
import {
  DistributionInterface,
  DistributionStateEnum,
  PreparingDistributionNode,
} from "../type/mod.ts";
import type { Operation } from "../types.ts";
import {
  JoinDistributionUpdate,
  LeaveDistributionUpdate,
} from "../update/mod.ts";
import { amap, filter } from "../utils/mod.ts";

export const DistributionQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: {
    distribution: {
      type: new GraphQLNonNull(DistributionInterface),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { distributionId }, { kv }) {
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
    distributionCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["distribution_count"]);

        if (res.value === null) {
          throw new GraphQLError("Distribution count not found");
        }

        return Number(res.value);
      },
    },
    distributions: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(DistributionInterface),
        ),
      ),
      async resolve(_root, _args, { kv }) {
        const iter = kv.list<DistributionModel>({ prefix: ["distribution"] });

        return await amap(({ value }) => value, iter);
      },
    },
  },
});

export const DistributionMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createDistribution: {
      type: new GraphQLNonNull(PreparingDistributionNode),
      args: {
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      async resolve(_root, { name }, { user, kv }) {
        assertEditor(user);

        const nextIdRes = await kv.get<Deno.KvU64>(["distribution_next_id"]);

        if (nextIdRes.value === null) {
          throw new GraphQLError("Next Distribution ID not found");
        }

        const distribution: DistributionModel = {
          id: Number(nextIdRes.value),
          state: DistributionState.PREPARING,
          creatorId: user.id,
          name,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        assertDistribution(distribution);

        const commitRes = await kv.atomic()
          .check(nextIdRes)
          .set(["distribution", distribution.id], distribution)
          .set(
            ["distribution:field_count", distribution.id],
            new Deno.KvU64(0n),
          )
          .set(["distribution:field_ids", distribution.id], new Set<number>())
          .sum(["distribution_count"], 1n)
          .sum(["distribution_next_id"], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError("Failed to create Distribution");
        }

        return distribution;
      },
    },
    updateDistributionState: {
      type: new GraphQLNonNull(DistributionInterface),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        state: {
          type: new GraphQLNonNull(DistributionStateEnum),
        },
      },
      async resolve(_root, { distributionId, state }, { user, kv }) {
        assertEditor(user);

        const distributionRes = await kv.get<DistributionModel>([
          "distribution",
          distributionId,
        ]);

        if (distributionRes.value === null) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} not found`,
          );
        }

        switch (distributionRes.value.state) {
          case DistributionState.PREPARING: {
            if (state !== DistributionState.ANSWERING) {
              throw new GraphQLError("State order is violated");
            }

            const update: DistributionModel = {
              ...distributionRes.value,
              state,
              updatedAt: new Date(),
            };

            assertDistribution(update);

            const commitRes = await kv.atomic()
              .check(distributionRes)
              .set(["distribution", distributionId], update)
              .set(
                ["distribution:participant_count", distributionId],
                new Deno.KvU64(0n),
              )
              .set(
                ["distribution:male_participant_ids", distributionId],
                new Set<number>(),
              )
              .set(
                ["distribution:female_participant_ids", distributionId],
                new Set<number>(),
              )
              .commit();

            if (!commitRes.ok) {
              throw new GraphQLError(
                `Failed to update Distribution with ID ${distributionId}`,
              );
            }

            return update;
          }
          case DistributionState.ANSWERING: {
            if (state !== DistributionState.GATHERING) {
              throw new GraphQLError("State order is violated");
            }

            const update: DistributionModel = {
              ...distributionRes.value,
              state,
              updatedAt: new Date(),
            };

            assertDistribution(update);

            // TODO(machnevegor): notify users about the start of the feed

            const commitRes = await kv.atomic()
              .check(distributionRes)
              .set(["distribution", distributionId], update)
              .commit();

            if (!commitRes.ok) {
              throw new GraphQLError(
                `Failed to update Distribution with ID ${distributionId}`,
              );
            }

            return update;
          }
          case DistributionState.GATHERING: {
            if (state !== DistributionState.CLOSED) {
              throw new GraphQLError("State order is violated");
            }

            return await distribute(distributionRes, kv);
          }
          case DistributionState.CLOSED: {
            throw new GraphQLError("Distribution is in CLOSED state");
          }
        }
      },
    },
    updateDistributionName: {
      type: new GraphQLNonNull(DistributionInterface),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      async resolve(_root, { distributionId, name }, { user, kv }) {
        assertEditor(user);

        const distributionRes = await kv.get<DistributionModel>([
          "distribution",
          distributionId,
        ]);

        if (distributionRes.value === null) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} not found`,
          );
        }

        const update: DistributionModel = {
          ...distributionRes.value,
          name,
          updatedAt: new Date(),
        };

        assertDistribution(update);

        const commitRes = await kv.atomic()
          .check(distributionRes)
          .set(["distribution", distributionId], update)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to update Distribution with ID ${distributionId}`,
          );
        }

        return update;
      },
    },
    addDistributionField: {
      type: new GraphQLNonNull(PreparingDistributionNode),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { distributionId, fieldId }, { user, kv }) {
        assertEditor(user);

        const [
          distributionRes,
          fieldRes,
          fieldIdsRes,
        ] = await kv.getMany<[
          DistributionModel,
          FieldModel,
          Set<number>,
        ]>([
          ["distribution", distributionId],
          ["field", fieldId],
          ["distribution:field_ids", distributionId],
        ]);

        if (distributionRes.value === null) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} not found`,
          );
        }
        if (fieldRes.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }
        if (fieldIdsRes.value === null) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} not found`,
          );
        }

        if (distributionRes.value.state !== DistributionState.PREPARING) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} is not in PREPARING state`,
          );
        }

        if (fieldIdsRes.value.has(fieldId)) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} already has Field with ID ${fieldId}`,
          );
        }

        const fieldIds = new Set<number>([...fieldIdsRes.value, fieldId]);

        const commitRes = await kv.atomic()
          .check(fieldIdsRes)
          .set(["distribution:field_ids", distributionId], fieldIds)
          .sum(["distribution:field_count", distributionId], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to update Distribution with ID ${distributionId}`,
          );
        }

        return distributionRes.value;
      },
    },
    removeDistributionField: {
      type: new GraphQLNonNull(PreparingDistributionNode),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { distributionId, fieldId }, { user, kv }) {
        assertEditor(user);

        const [
          distributionRes,
          fieldCountRes,
          fieldIdsRes,
        ] = await kv.getMany<[
          DistributionModel,
          Deno.KvU64,
          Set<number>,
        ]>([
          ["distribution", distributionId],
          ["distribution:field_count", distributionId],
          ["distribution:field_ids", distributionId],
        ]);

        if (distributionRes.value === null) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} not found`,
          );
        }
        if (fieldCountRes.value === null) {
          throw new GraphQLError(
            `Field count of Distribution with ID ${distributionId} not found`,
          );
        }
        if (fieldIdsRes.value === null) {
          throw new GraphQLError(
            `Field IDs of Distribution with ID ${distributionId} not found`,
          );
        }

        if (distributionRes.value.state !== DistributionState.PREPARING) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} is not in PREPARING state`,
          );
        }

        if (!fieldIdsRes.value.has(fieldId)) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} does not have Field with ID ${fieldId}`,
          );
        }

        const fieldIds = new Set<number>([...fieldIdsRes.value, fieldId]);

        const commitRes = await kv.atomic()
          .check(fieldCountRes)
          .check(fieldIdsRes)
          .set(
            ["distribution:field_count", distributionId],
            new Deno.KvU64(BigInt(fieldIds.size)),
          )
          .set(["distribution:field_ids", distributionId], fieldIds)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to update Distribution with ID ${distributionId}`,
          );
        }

        return distributionRes.value;
      },
    },
    deleteDistribution: {
      type: new GraphQLNonNull(GraphQLInt),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { distributionId }, { user, kv }) {
        assertEditor(user);

        const distributionRes = await kv.get<DistributionModel>([
          "distribution",
          distributionId,
        ]);

        if (distributionRes.value === null) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} not found`,
          );
        }

        if (distributionRes.value.state !== DistributionState.PREPARING) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} is not in PREPARING state`,
          );
        }

        const commitRes = await kv.atomic()
          .check(distributionRes)
          .delete(["distribution", distributionId])
          .delete(["distribution:field_ids", distributionId])
          .delete(["distribution:field_count", distributionId])
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to delete Distribution with ID ${distributionId}`,
          );
        }

        return distributionId;
      },
    },
    joinDistribution: {
      type: new GraphQLNonNull(JoinDistributionUpdate),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { distributionId }, { user, kv }) {
        const participantIdsKey = [
          user.profile.gender === Gender.MALE
            ? "distribution:male_participant_ids"
            : "distribution:female_participant_ids",
          distributionId,
        ];

        const [
          distributionRes,
          participantIdsRes,
          distributionIdsRes,
        ] = await kv.getMany<[
          DistributionModel,
          Set<number>,
          Set<number>,
        ]>([
          ["distribution", distributionId],
          participantIdsKey,
          ["user:distribution_ids", user.id],
        ]);

        if (distributionRes.value === null) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} not found`,
          );
        }
        if (participantIdsRes.value === null) {
          throw new GraphQLError(
            `Participant IDs of Distribution with ID ${distributionId} not found`,
          );
        }
        if (distributionIdsRes.value === null) {
          throw new GraphQLError(
            `Distribution IDs of User with ID ${user.id} not found`,
          );
        }

        if (
          distributionRes.value.state !== DistributionState.ANSWERING &&
          distributionRes.value.state !== DistributionState.GATHERING
        ) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} is not in ANSWERING or GATHERING state`,
          );
        }

        const inParticipantIds = participantIdsRes.value.has(user.id);
        const inDistributionIds = distributionIdsRes.value.has(distributionId);

        if (inParticipantIds && inDistributionIds) {
          return { distribution: distributionRes.value, user };
        }

        const operation = kv.atomic();

        if (!inParticipantIds) {
          const participantIds = new Set<number>([
            ...participantIdsRes.value,
            user.id,
          ]);

          operation
            .check(participantIdsRes)
            .set(participantIdsKey, participantIds)
            .sum(["distribution:participant_count", distributionId], 1n);
        }

        if (!inDistributionIds) {
          const distributionIds = new Set<number>([
            ...distributionIdsRes.value,
            distributionId,
          ]);

          operation
            .check(distributionIdsRes)
            .set(["user:distribution_ids", user.id], distributionIds)
            .sum(["user:distribution_count", user.id], 1n);
        }

        const commitRes = await operation.commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to join to Distribution with ID ${distributionId}`,
          );
        }

        return { distribution: distributionRes.value, user };
      },
    },
    leaveDistribution: {
      type: new GraphQLNonNull(LeaveDistributionUpdate),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { distributionId }, { user, kv }) {
        const participantIdsKey = [
          user.profile.gender === Gender.MALE
            ? "distribution:male_participant_ids"
            : "distribution:female_participant_ids",
          distributionId,
        ];

        const [
          distributionRes,
          participantCountRes,
          participantIdsRes,
          distributionCountRes,
          distributionIdsRes,
        ] = await kv.getMany<[
          DistributionModel,
          Deno.KvU64,
          Set<number>,
          Deno.KvU64,
          Set<number>,
        ]>([
          ["distribution", distributionId],
          ["distribution:participant_count", distributionId],
          participantIdsKey,
          ["user:distribution_count", user.id],
          ["user:distribution_ids", user.id],
        ]);

        if (distributionRes.value === null) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} not found`,
          );
        }
        if (participantCountRes.value === null) {
          throw new GraphQLError(
            `Participant count of Distribution with ID ${distributionId} not found`,
          );
        }
        if (participantIdsRes.value === null) {
          throw new GraphQLError(
            `Participant IDs of Distribution with ID ${distributionId} not found`,
          );
        }
        if (distributionCountRes.value === null) {
          throw new GraphQLError(
            `Distribution count of User with ID ${user.id} not found`,
          );
        }
        if (distributionIdsRes.value === null) {
          throw new GraphQLError(
            `Distribution IDs of User with ID ${user.id} not found`,
          );
        }

        if (
          distributionRes.value.state !== DistributionState.ANSWERING &&
          distributionRes.value.state !== DistributionState.GATHERING
        ) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} is not in ANSWERING or GATHERING state`,
          );
        }

        const inParticipantIds = participantIdsRes.value.has(user.id);
        const inDistributionIds = distributionIdsRes.value.has(distributionId);

        if (!inParticipantIds && !inDistributionIds) {
          return { distribution: distributionRes.value, user };
        }

        const operation = kv.atomic();

        if (inParticipantIds) {
          const participantIds = new Set<number>(
            filter((id) => id !== user.id, participantIdsRes.value),
          );

          operation
            .check(participantCountRes)
            .check(participantIdsRes)
            .set(
              ["distribution:participant_count", distributionId],
              new Deno.KvU64(BigInt(participantIds.size)),
            )
            .set(participantIdsKey, participantIds);
        }

        if (inDistributionIds) {
          const distributionIds = new Set<number>(
            filter((id) => id !== distributionId, distributionIdsRes.value),
          );

          operation
            .check(distributionCountRes)
            .check(distributionIdsRes)
            .set(
              ["user:distribution_count", user.id],
              new Deno.KvU64(BigInt(distributionIds.size)),
            )
            .set(["user:distribution_ids", user.id], distributionIds);
        }

        const commitRes = await operation.commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to leave from Distribution with ID ${distributionId}`,
          );
        }

        return { distribution: distributionRes.value, user };
      },
    },
  },
});
