import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../../../deps.ts";
import { amap } from "../../../utils/mod.ts";
import { assertAuthenticated } from "../../database/assert/mod.ts";
import type { DistributionModel } from "../../database/model/mod.ts";
import { DistributionState } from "../../database/model/mod.ts";
import {
  createDistribution,
  deleteDistribution,
  joinDistribution,
  leaveDistribution,
  updateDistributionFields,
  updateDistributionName,
  updateDistributionState,
} from "../../database/operation/mod.ts";
import {
  DistributionInterface,
  DistributionStateEnum,
  PreparingDistributionNode,
} from "../type/mod.ts";
import type { Operation } from "../types.ts";
import type {
  JoinDistributionUpdateModel,
  LeaveDistributionUpdateModel,
} from "../update/mod.ts";
import {
  JoinDistributionUpdate,
  LeaveDistributionUpdate,
} from "../update/mod.ts";

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
      async resolve(
        _root,
        { distributionId }: { distributionId: number },
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
    distributionCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, { kv }): Promise<number> {
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
      async resolve(_root, _args, { kv }): Promise<DistributionModel[]> {
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
      async resolve(
        _root,
        args: { name: string },
        context,
      ): Promise<DistributionModel> {
        assertAuthenticated(context);

        return await createDistribution(context, args);
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
      async resolve(
        _root,
        args: { distributionId: number; state: DistributionState },
        context,
      ): Promise<DistributionModel> {
        assertAuthenticated(context);

        return await updateDistributionState(context, args);
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
      async resolve(
        _root,
        args: { distributionId: number; name: string },
        context,
      ): Promise<DistributionModel> {
        assertAuthenticated(context);

        return await updateDistributionName(context, args);
      },
    },
    updateDistributionFields: {
      type: new GraphQLNonNull(PreparingDistributionNode),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        fieldIds: {
          type: new GraphQLNonNull(
            new GraphQLList(
              new GraphQLNonNull(GraphQLInt),
            ),
          ),
        },
      },
      async resolve(
        _root,
        args: { distributionId: number; fieldIds: readonly number[] },
        context,
      ): Promise<DistributionModel> {
        assertAuthenticated(context);

        return await updateDistributionFields(context, args);
      },
    },
    deleteDistribution: {
      type: new GraphQLNonNull(GraphQLInt),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        args: { distributionId: number },
        context,
      ): Promise<number> {
        assertAuthenticated(context);

        return await deleteDistribution(context, args);
      },
    },
    joinDistribution: {
      type: new GraphQLNonNull(JoinDistributionUpdate),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        args: { distributionId: number },
        context,
      ): Promise<JoinDistributionUpdateModel> {
        assertAuthenticated(context);

        return await joinDistribution(context, args);
      },
    },
    leaveDistribution: {
      type: new GraphQLNonNull(LeaveDistributionUpdate),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        args: { distributionId: number },
        context,
      ): Promise<LeaveDistributionUpdateModel> {
        assertAuthenticated(context);

        return await leaveDistribution(context, args);
      },
    },
  },
});
