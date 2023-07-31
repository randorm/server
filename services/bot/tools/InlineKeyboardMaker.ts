import { InlineButton } from "../../bot/mod.ts";

export function makeInlineKeyboard(
  isFieldEditing: boolean | undefined,
  answers: readonly string[],
  needBack: boolean,
): InlineButton[][] {
  const inlineKeyboard: InlineButton[][] = [];
  for (let i = 0; i < answers.length; i++) {
    inlineKeyboard.push([{ text: answers[i], callback_data: answers[i] }]);
  }
  if (needBack === true && isFieldEditing === true) {
    inlineKeyboard.push([{ text: "Skip", callback_data: "next_field" }, {
      text: "Back",
      callback_data: "back_field",
    }]);
  } else if (needBack === true) {
    inlineKeyboard.push([{ text: "Back", callback_data: "back_field" }]);
  } else {
    inlineKeyboard.push([{ text: "Skip", callback_data: "next_field" }]);
  }
  inlineKeyboard.push([{ text: "Cancel", callback_data: "cancel_field" }]);

  return inlineKeyboard;
}
