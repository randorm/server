import { GraphQLError } from "../../../deps.ts";
import type { ChoiceFieldModel, TextFieldModel } from "../model/mod.ts";

export function assertTextField(field: TextFieldModel) {
  if (!field.question || field.question.length > 1024) {
    throw new GraphQLError(
      "Question of TextField must be between 1 and 1024 characters",
    );
  }

  if (field.format === "") {
    throw new GraphQLError("TextField has a format that can be omitted");
  }
  if (field.sample === "") {
    throw new GraphQLError("TextField has a sample that can be omitted");
  }

  if (
    field.format && field.sample && !new RegExp(field.format).test(field.sample)
  ) {
    throw new GraphQLError("Sample of TextField does not match the format");
  }
}

export function assertChoiceField(field: ChoiceFieldModel) {
  if (!field.question || field.question.length > 1024) {
    throw new GraphQLError(
      "Question of ChoiceField must be between 1 and 1024 characters",
    );
  }

  if (!field.options.length) {
    throw new GraphQLError("ChoiceField has no options");
  }
  if (field.options.length > 10) {
    throw new GraphQLError("ChoiceField has too many options");
  }

  for (const option of field.options) {
    if (!option || option.length > 32) {
      throw new GraphQLError(
        "Option name of ChoiceField must be between 1 and 32 characters",
      );
    }
  }
}
