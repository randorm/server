import { GraphQLError } from "../deps.ts";
import type { TextFieldModel } from "../model/mod.ts";

export function assertTextField(field: TextFieldModel) {
  if (!field.question.length || field.question.length > 1024) {
    throw new GraphQLError(
      "Question of TextField must be between 1 and 1024 characters",
    );
  }

  if (field.format === "") {
    throw new GraphQLError("TextField has a format that can be omitted");
  }

  if (field.sample === "" && field.sample.length > 64) {
    throw new GraphQLError(
      "Sample of TextField must be between 1 and 64 characters",
    );
  }

  if (
    field.format && field.sample && !new RegExp(field.format).test(field.sample)
  ) {
    throw new GraphQLError("Sample of TextField does not match the format");
  }
}
