import { GraphQLError } from "../deps.ts";
import type { ChoiceAnswerModel, FieldModel } from "../model/mod.ts";
import { FieldTypeModel } from "../model/mod.ts";

export function assertChoiceAnswer(
  answer: ChoiceAnswerModel,
  field: FieldModel,
) {
  if (field.type !== FieldTypeModel.CHOICE) {
    throw new GraphQLError(`Field with ID ${field.id} is not a choice field`);
  }

  if (!answer.value.size) {
    throw new GraphQLError(`Answer for Field with ID ${field.id} is empty`);
  }

  for (const optionIndex of answer.value) {
    if (optionIndex < 0 || optionIndex >= field.options.length) {
      throw new GraphQLError(
        `Answer for Field with ID ${field.id} contains invalid option index ${optionIndex}`,
      );
    }
  }
}
