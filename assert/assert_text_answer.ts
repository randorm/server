import { GraphQLError } from "../deps.ts";
import type { TextAnswerModel, TextFieldModel } from "../model/mod.ts";

export function assertTextAnswer(
  answer: TextAnswerModel,
  field: TextFieldModel,
) {
  if (!answer.value) {
    throw new GraphQLError(
      `Answer to TextField with ID ${field.id} from User with ID ${answer.respondentId} is empty`,
    );
  }

  if (field.format && !new RegExp(field.format).test(answer.value)) {
    throw new GraphQLError(
      `Answer to TextField with ID ${field.id} from User with ID ${answer.respondentId} does not match format`,
    );
  }
}
