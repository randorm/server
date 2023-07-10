import { GraphQLError } from "../../../deps.ts";
import type { DistributionModel } from "../model/mod.ts";

export function assertDistribution(distribution: DistributionModel) {
  if (!distribution.name || distribution.name.length > 64) {
    throw new GraphQLError(
      "Name of Distribution must be between 1 and 64 characters",
    );
  }
}
