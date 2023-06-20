import { GraphQLError, GraphQLScalarType, Kind } from "../deps.ts";

export const DateScalar = new GraphQLScalarType({
  name: "Date",
  serialize(value) {
    if (value instanceof Date) {
      return value.getTime();
    }

    throw new GraphQLError("The value must be an instance of Date");
  },
  parseValue(value) {
    if (typeof value === "number") {
      return new Date(value);
    }

    throw new GraphQLError("The serialized value must be a number");
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }

    throw new GraphQLError("The serialized value must be a number");
  },
});
