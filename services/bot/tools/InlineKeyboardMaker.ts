import { InlineButton } from "../../bot/mod.ts";

export function makeInlineKeyboard(
  answers: readonly string[],
): InlineButton[][] {
  const inlineKeyboard: InlineButton[][] = [];
  for (let i = 0; i < answers.length; i++) {
    inlineKeyboard.push([{ text: answers[i], callback_data: answers[i] }]);
  }

  return inlineKeyboard;
}
