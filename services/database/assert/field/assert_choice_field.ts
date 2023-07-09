import { GraphQLError } from "../../../../deps.ts";
import type { ChoiceFieldModel } from "../../model/mod.ts";

export function assertChoiceField(field: ChoiceFieldModel) {
  if (!field.question || field.question.length > 256) {
    throw new GraphQLError(
      "Question of ChoiceField must be between 1 and 256 characters",
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
