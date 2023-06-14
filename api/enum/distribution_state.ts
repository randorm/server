import { GraphQLEnumType } from "../deps.ts";

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
