import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "../../../deps.ts";
import type { DistributionModel, UserModel } from "../../database/model/mod.ts";
import { DistributionState } from "../../database/model/mod.ts";
import {
  AnsweringDistributionNode,
  GatheringDistributionNode,
  UserNode,
} from "../type/mod.ts";
import type { Node } from "../types.ts";

export interface JoinDistributionUpdateModel {
  readonly distribution: DistributionModel;
  readonly user: UserModel;
}

export const JoinableDistributionUnion = new GraphQLUnionType({
  name: "JoinableDistribution",
  types: [
    AnsweringDistributionNode,
    GatheringDistributionNode,
  ],
  resolveType({ state }: DistributionModel) {
    switch (state) {
      case DistributionState.ANSWERING:
        return "AnsweringDistribution";
      case DistributionState.GATHERING:
        return "GatheringDistribution";
    }
  },
});

export const JoinDistributionUpdate: Node<
  JoinDistributionUpdateModel
> = new GraphQLObjectType({
  name: "JoinDistributionUpdate",
  fields: {
    distribution: {
      type: new GraphQLNonNull(JoinableDistributionUnion),
    },
    user: {
      type: new GraphQLNonNull(UserNode),
    },
  },
});

export interface LeaveDistributionUpdateModel {
  readonly distribution: DistributionModel;
  readonly user: UserModel;
}

export const LeavableDistributionUnion = new GraphQLUnionType({
  name: "LeavableDistribution",
  types: [
    AnsweringDistributionNode,
    GatheringDistributionNode,
  ],
  resolveType({ state }: DistributionModel) {
    switch (state) {
      case DistributionState.ANSWERING:
        return "AnsweringDistribution";
      case DistributionState.GATHERING:
        return "GatheringDistribution";
    }
  },
});

export const LeaveDistributionUpdate: Node<
  LeaveDistributionUpdateModel
> = new GraphQLObjectType({
  name: "LeaveDistributionUpdate",
  fields: {
    distribution: {
      type: new GraphQLNonNull(LeavableDistributionUnion),
    },
    user: {
      type: new GraphQLNonNull(UserNode),
    },
  },
});
