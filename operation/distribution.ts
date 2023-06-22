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
import { DistributionState } from "../model/mod.ts";
import {
  DistributionInterface,
  DistributionStateEnum,
  PreparingDistributionNode,
} from "../type/mod.ts";
import type { Operation } from "../types.ts";
import { asyncMap } from "../util/mod.ts";

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

        return await asyncMap(({ value }) => value, iter);
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
            if (state !== DistributionState.GATHERING) {
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
          case DistributionState.GATHERING: {
            if (state !== DistributionState.CLOSED) {
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
              // TODO: distribute students and notify them
              .set(
                ["distribution:group_count", distributionId],
                new Deno.KvU64(0n),
              )
              .set(
                ["distribution:group_ids", distributionId],
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

        if (distributionRes.value.state !== DistributionState.PREPARING) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} is not in PREPARING state`,
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

        if (fieldIdsRes.value.has(fieldId)) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} already has Field with ID ${fieldId}`,
          );
        }

        const fieldIds = new Set([...fieldIdsRes.value, fieldId]);

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

        if (distributionRes.value.state !== DistributionState.PREPARING) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} is not in PREPARING state`,
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

        if (!fieldIdsRes.value.has(fieldId)) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} does not have Field with ID ${fieldId}`,
          );
        }

        const fieldIds = new Set([...fieldIdsRes.value, fieldId]);

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
  },
});
