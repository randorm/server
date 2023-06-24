import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "../deps.ts";
import { DistributionState } from "../model/mod.ts";
import {
  AnsweringDistributionNode,
  GatheringDistributionNode,
  UserNode,
} from "../type/mod.ts";

export const JoinableDistributionUnion = new GraphQLUnionType({
  name: "JoinableDistribution",
  types: [
    AnsweringDistributionNode,
    GatheringDistributionNode,
  ],
  resolveType({ state }) {
    switch (state) {
      case DistributionState.ANSWERING:
        return "AnsweringDistribution";
      case DistributionState.GATHERING:
        return "GatheringDistribution";
    }
  },
});

export const JoinDistributionUpdate = new GraphQLObjectType({
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

export const LeavableDistributionUnion = new GraphQLUnionType({
  name: "LeavableDistribution",
  types: [
    AnsweringDistributionNode,
    GatheringDistributionNode,
  ],
  resolveType({ state }) {
    switch (state) {
      case DistributionState.ANSWERING:
        return "AnsweringDistribution";
      case DistributionState.GATHERING:
        return "GatheringDistribution";
    }
  },
});

export const LeaveDistributionUpdate = new GraphQLObjectType({
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
