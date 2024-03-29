import { GraphQLError } from "../../../deps.ts";
import type {
  ChoiceAnswerModel,
  ChoiceFieldModel,
  TextAnswerModel,
  TextFieldModel,
} from "../model/mod.ts";

export function assertTextAnswer(
  answer: TextAnswerModel,
  field: TextFieldModel,
) {
  if (!answer.value) {
    throw new GraphQLError(
      `Answer to TextField with ID ${field.id} from User with ID ${answer.respondentId} is empty`,
    );
  }

  if (answer.value.length > 4096) {
    throw new GraphQLError(
      `Answer to TextField with ID ${field.id} from User with ID ${answer.respondentId} is too long`,
    );
  }

  if (field.format && !new RegExp(field.format).test(answer.value)) {
    throw new GraphQLError(
      `Answer to TextField with ID ${field.id} from User with ID ${answer.respondentId} does not match format`,
    );
  }
}

export function assertChoiceAnswer(
  answer: ChoiceAnswerModel,
  field: ChoiceFieldModel,
) {
  if (!answer.indices.size) {
    throw new GraphQLError(
      `Answer to ChoiceField with ID ${field.id} from User with ID ${answer.respondentId} is empty`,
    );
  }

  if (!field.multiple && answer.indices.size > 1) {
    throw new GraphQLError(
      `Answer to ChoiceField with ID ${field.id} from User with ID ${answer.respondentId} is not multiple`,
    );
  }

  for (const optionIndex of answer.indices) {
    if (optionIndex < 0 || optionIndex >= field.options.length) {
      throw new GraphQLError(
        `Answer to ChoiceField with ID ${field.id} contains invalid option index ${optionIndex}`,
      );
    }
  }
}
