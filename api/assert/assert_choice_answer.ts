import { GraphQLError } from "../deps.ts";
import type { ChoiceAnswerModel, ChoiceFieldModel } from "../model/mod.ts";

export function assertChoiceAnswer(
  answer: ChoiceAnswerModel,
  field: ChoiceFieldModel,
) {
  if (!answer.value.size) {
    throw new GraphQLError(`Answer for Field with ID ${field.id} is empty`);
  }

  if (!field.multiple && answer.value.size > 1) {
    throw new GraphQLError(`Answer for Field with ID ${field.id} is multiple`);
  }

  for (const optionIndex of answer.value) {
    if (optionIndex < 0 || optionIndex >= field.options.length) {
      throw new GraphQLError(
        `Answer for Field with ID ${field.id} contains invalid option index ${optionIndex}`,
      );
    }
  }
}
