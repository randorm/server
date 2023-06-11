import { GraphQLError } from "../deps.ts";
import type { FieldModel, TextAnswerModel } from "../model/mod.ts";
import { FieldTypeModel } from "../model/mod.ts";

export function assertTextAnswer(answer: TextAnswerModel, field: FieldModel) {
  if (field.type !== FieldTypeModel.TEXT) {
    throw new GraphQLError(`Field with ID ${field.id} is not a text field`);
  }

  if (!answer.value) {
    throw new GraphQLError(
      `Answer to Field with ID ${field.id} from User with ID ${answer.respondentId} is empty`,
    );
  }

  if (field.format && !new RegExp(field.format).test(answer.value)) {
    throw new GraphQLError(
      `Answer to Field with ID ${field.id} from User with ID ${answer.respondentId} does not match format`,
    );
  }
}
