import { GraphQLObjectType } from "../deps.ts";

export function mergeTypes(
  types: GraphQLObjectType[],
  name: string,
): GraphQLObjectType {
  const configs = types.map((type) => type.toConfig());

  return new GraphQLObjectType({
    name,
    fields: configs.reduce(
      (acc, { fields }) => ({ ...acc, ...fields }),
      {},
    ),
  });
}
