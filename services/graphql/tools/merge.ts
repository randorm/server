import type {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
} from "../../../deps.ts";
import { GraphQLObjectType } from "../../../deps.ts";

export type ObjectTypes<Sources extends unknown[], Context> = {
  [K in keyof Sources]: GraphQLObjectType<Sources[K], Context>;
};

export type MergedSource<Sources extends unknown[]> = Sources extends
  [infer T, ...infer Rest] ? T & MergedSource<Rest> : unknown;

export function mergeObjectTypes<Sources extends unknown[], Context>(
  types: ObjectTypes<Sources, Context>,
  name: string,
): GraphQLObjectType<MergedSource<Sources>, Context> {
  const configs = types.map((type) => type.toConfig());

  const interfaces = configs.reduce<GraphQLInterfaceType[]>(
    (acc, { interfaces }) => [...acc, ...interfaces],
    [],
  );
  const fields = configs.reduce<
    GraphQLFieldConfigMap<MergedSource<Sources>, Context>
  >((acc, { fields }) => ({ ...acc, ...fields }), {});

  return new GraphQLObjectType({ name, interfaces, fields });
}
