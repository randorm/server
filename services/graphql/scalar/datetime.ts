import {
  format,
  GraphQLError,
  GraphQLScalarType,
  Kind,
  parse,
} from "../../../deps.ts";

export const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  serialize(value) {
    if (value instanceof Date) {
      return format(value, "yyyy-MM-dd HH:mm:ss");
    }

    throw new GraphQLError("The value must be an instance of Date");
  },
  parseValue(value) {
    if (typeof value === "string") {
      try {
        return parse(value, "yyyy-MM-dd HH:mm:ss");
      } catch {
        throw new GraphQLError(
          "The value must be in `yyyy-MM-dd HH:mm:ss` format",
        );
      }
    }

    throw new GraphQLError("The serialized value must be a string");
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      try {
        return parse(ast.value, "yyyy-MM-dd HH:mm:ss");
      } catch {
        throw new GraphQLError(
          "The value must be in `yyyy-MM-dd HH:mm:ss` format",
        );
      }
    }

    throw new GraphQLError("The serialized value must be a string");
  },
});
