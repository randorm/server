import {
  format,
  GraphQLError,
  GraphQLScalarType,
  Kind,
  parse,
} from "../../../deps.ts";

export const DateScalar = new GraphQLScalarType({
  name: "Date",
  serialize(value) {
    if (value instanceof Date) {
      return format(value, "yyyy-MM-dd");
    }

    throw new GraphQLError("The value must be an instance of Date");
  },
  parseValue(value) {
    if (typeof value === "string") {
      try {
        return parse(value, "yyyy-MM-dd");
      } catch {
        throw new GraphQLError("The value must be in `yyyy-MM-dd` format");
      }
    }

    throw new GraphQLError("The serialized value must be a string");
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      try {
        return parse(ast.value, "yyyy-MM-dd");
      } catch {
        throw new GraphQLError("The value must be in `yyyy-MM-dd` format");
      }
    }

    throw new GraphQLError("The serialized value must be a string");
  },
});
