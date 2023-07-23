import { InlineButton } from "../../bot/mod.ts";

export function makeInlineKeyboard(
  answers: readonly string[], needBack: boolean
): InlineButton[][] {
  const inlineKeyboard: InlineButton[][] = [];
  for (let i = 0; i < answers.length; i++) {
    inlineKeyboard.push([{ text: answers[i], callback_data: answers[i] }]);
  }
  if (needBack === true) {
    inlineKeyboard.push([{ text: "Back", callback_data: "back_field" }]);
  }

  return inlineKeyboard;
}
