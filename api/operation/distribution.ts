import { assertDistribution, assertEditor } from "../assert/mod.ts";
import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import type { DistributionModel, GroupModel } from "../model/mod.ts";
import { DistributionStateModel } from "../model/mod.ts";
import { DistributionNode, GroupNode } from "../node/mod.ts";
import type { Operation } from "../types.ts";
import { asyncMap } from "../util/mod.ts";

export const DistributionQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: {
    group: {
      type: new GraphQLNonNull(GroupNode),
      args: {
        groupId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { groupId }, { kv }) {
        const res = await kv.get<GroupModel>(["group", groupId]);

        if (res.value === null) {
          throw new GraphQLError(`Group with ID ${groupId} not found`);
        }

        return res.value;
      },
    },
    groupCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["group_count"]);

        if (res.value === null) {
          throw new GraphQLError("Group count not found");
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
      async resolve(_root, _args, { kv }) {
        const iter = kv.list<GroupModel>({ prefix: ["group"] });

        return await asyncMap(({ value }) => value, iter);
      },
    },
    distribution: {
      type: new GraphQLNonNull(DistributionNode),
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
          new GraphQLNonNull(DistributionNode),
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
      type: new GraphQLNonNull(DistributionNode),
      args: {
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      async resolve(_root, { name }, { user, kv }) {
        assertEditor(user);

        const nextRes = await kv.get<Deno.KvU64>(["distribution_next_id"]);

        if (nextRes.value === null) {
          throw new GraphQLError("Next Distribution ID not found");
        }

        const distribution: DistributionModel = {
          id: Number(nextRes.value),
          state: DistributionStateModel.PREPARING,
          creatorId: user.id,
          name,
          fieldIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        assertDistribution(distribution);

        const commitRes = await kv.atomic()
          .check(nextRes)
          .set(["distribution", distribution.id], distribution)
          .sum(["distribution_count"], 1n)
          .sum(["distribution_next_id"], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError("Failed to create Distribution");
        }

        return distribution;
      },
    },
    updateDistributionName: {
      type: new GraphQLNonNull(DistributionNode),
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

        if (distributionRes.value.state !== DistributionStateModel.PREPARING) {
          throw new GraphQLError(
            `Distribution with ID ${distributionId} is not in PREPARING state`,
          );
        }

        const commitRes = await kv.atomic()
          .check(distributionRes)
          .delete(["distribution", distributionId])
          .sum(["distribution_count"], -1n)
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
