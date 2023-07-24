import { Composer, InlineKeyboard } from "../../deps.ts";
import { DateTimeScalar } from "../../services/graphql/scalar/datetime.ts";
import type { BotContext } from "../../types.ts";
import { difference } from "../../utils/iter.ts";
import {
  setChoiceAnswer,
  setTextAnswer,
} from "../database/operation/answer.ts";
import { field } from "../database/operation/field.ts";
import {
  createUser,
  updateUserProfile,
  userDistributionsIds,
  userFieldIds,
} from "../database/operation/user.ts";
import {
  distribution,
  distributionFieldIds,
  joinDistribution,
} from "../database/operation/distribution.ts";
import {
  FieldModel,
  FieldType,
  Gender,
  ProfileModel,
  UserContext,
} from "./mod.ts";
import { makeInlineKeyboard } from "./tools/InlineKeyboardMaker.ts";
import { createUserContext } from "./tools/authentificate.ts";
import { isValidDate } from "./tools/validDateTemp.ts";
import { EditingStep, FieldStep, RegistrationStep } from "./types.ts";
import { CANCEL_GIF_ID, START_GIF_ID } from "../../utils/constants.ts";

export const composer = new Composer<BotContext>();

composer.command("start", async (ctx: BotContext) => {
  // If the link to bot contains distribution ID (start=???), then we need to catch it.
  const distributionIdTemp = ctx.message?.text?.split(" ")[1];
  let check = 0;
  if (typeof distributionIdTemp === "string") {
    const distributionId: number = parseInt(distributionIdTemp, 10);
    if (
      distribution(ctx.state, { distributionId: distributionId }) !== null &&
      ctx.session.distributionId === undefined
    ) {
      ctx.session.distributionId = distributionId;
      if (
        ctx.session.registrationStep === RegistrationStep.Finish &&
        ctx.session.userModel
      ) {
        await ctx.reply(
          "Hey hey, your distribution id was read, you can start answering the questions /answer :)",
        );
        check = 1;
      }
    }
  } else {
    if (ctx.chat) {
      if (ctx.session.registrationStep === RegistrationStep.Finish) {
        await ctx.api.sendAnimation(
          ctx.chat.id,
          START_GIF_ID,
        );
      }
    }
  }
  // Before starting working with bot, user need to have alias.

  if (!ctx.from?.username) {
    await ctx.reply(
      "Oops, wait. We can't detect your @username. Please go into the settings and fix it",
    );
  } else if (
    ctx.session.registrationStep !== RegistrationStep.Finish &&
    !ctx.session.userModel
  ) {
    // Starting the proccess of registration.
    const newMessage = await ctx.reply(
      "Hi, here we will help you to find the perfect roommates",
      { parse_mode: "Markdown" },
    );
    ctx.session.lastBotMessageId = newMessage.message_id;
    await askFirstName(ctx);
  } else {
    // User can check and edit profile.
    if (check === 0) {
      const keyboard = [
        [{ text: "View profile", callback_data: "profile" }],
      ];
      const newMessage = await ctx.reply(
        `Hi, hi, hi! Is something wrong?`,
        {
          reply_markup: {
            inline_keyboard: keyboard,
          },
        },
      );
      ctx.session.lastBotMessageId = newMessage.message_id;
    }
  }
});

// Command for starting answering the questions for distribution.
composer.command("answer", async (ctx: BotContext) => {
  // For doing that user need to have distribution ID (it's not in graphql, but in session right now)
  // Only after answering ALL questions, distribution will be in graphql.
  ctx.session.previousMessagesIdsForFields = [];
  ctx.session.removedFieldIds = [];
  ctx.session.isFirstField = undefined;
  if (ctx.session.distributionId && !ctx.session.answeredQuestions) {
    const newMessage = await ctx.reply(
      "Let's start answering the questions :)",
    );
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.fieldStep = FieldStep.PROCESS;
    ctx.session.fieldCurrentIndex = 0;
    if (
      ctx.session.userModel?.id && ctx.session.userData?.name &&
      ctx.session.userData?.surname && ctx.session.userData?.gender &&
      ctx.session?.userData.birthday && ctx.session?.userData.bio
    ) {
      const userId = ctx.session.userModel.id;
      const userContext: UserContext = await createUserContext(
        ctx.state,
        userId,
      );
      if (
        typeof userContext === "object" && userContext !== null &&
        ctx.session.distributionId !== undefined
      ) {
        const allFieldsIds: Set<number> = await distributionFieldIds(
          ctx.state,
          { distributionId: ctx.session.distributionId },
        );
        const answeredIds: Set<number> = await userFieldIds(
          userContext,
        );
        const needToAnswerFieldIds: Set<number> = difference<number>(
          allFieldsIds,
          answeredIds,
        );
        ctx.session.fieldsIds = [...needToAnswerFieldIds];
        ctx.session.fieldAmount = ctx.session.fieldsIds.length;

        // After getting all fields ids, start proccess.
        if (
          needToAnswerFieldIds && ctx.session.fieldAmount > 0 && ctx.chat &&
          ctx.session.lastBotMessageId
        ) {
          await ctx.api.editMessageText(
            ctx.chat.id,
            ctx.session.lastBotMessageId,
            "Hey! You need to answer some questions about personality. Please, answer honestly :)\nLet's start now!",
          );
          await askField(ctx);
        } else if (ctx.chat && ctx.session.lastBotMessageId) {
          await ctx.api.editMessageText(
            ctx.chat.id,
            ctx.session.lastBotMessageId,
            "You are lucky (or you are a developer?), we don't have any questions for you. Try /feed now :)",
          );
          ctx.session.fieldStep = FieldStep.FINISH;
        }
      } else {
        await ctx.reply("We have problems on server side.");
      }
    }
  } else {
    await ctx.reply(
      "It seems you didn't get the link or already answered questions. Please, be patient, the link will be delivered to you soon :)",
    );
  }
});

// Run WEBAPP.
composer.command("feed", async (ctx: BotContext) => {
  if (ctx.chat && ctx.session.fieldStep === FieldStep.FINISH) {
    const inlineKeyboardWebApp = new InlineKeyboard().webApp(
      "Open",
      "https://randorm.com/feed/" + ctx.session.distributionId,
    );
    await ctx.api.sendMessage(
      ctx.chat.id,
      "Let's open feed.",
      {
        reply_markup: inlineKeyboardWebApp,
      },
    );
  } else if (ctx.chat) {
    await ctx.api.sendMessage(ctx.chat.id, "Wait for the link, please");
  }
});

composer.command("cancel", async (ctx: BotContext) => {
  if (ctx.chat && ctx.session.fieldStep === FieldStep.PROCESS) {
    ctx.session.fieldStep = undefined;
    await ctx.api.sendMessage(
      ctx.chat.id,
      "Done.",
    );
  }
});

composer.command("soshelp", async (ctx: BotContext) => {
  if (ctx.chat) {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "Now I'm helping you...",
    );
    ctx.session.editingStep = undefined;
    await ctx.api.sendMessage(ctx.chat.id, "Help? Let's check");
  }
});

// Registration. First name.
async function askFirstName(ctx: BotContext) {
  await ctx.reply(
    "Let's get to know each other. My name is Randorm, what's yours?",
  );
  const newMessage = await ctx.reply(
    "Enter your first name like ___Ivan___",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Cancel", callback_data: "cancel" }],
        ],
      },
      parse_mode: "Markdown",
    },
  );
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.FirstName;
}

// Registration. Second name.
async function askSecondName(ctx: BotContext) {
  if (ctx.chat?.id && ctx.session.lastBotMessageId) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
  }
  const newMessage = await ctx.reply(
    "Enter your last name like ___Ivanov___",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "back" }, {
            text: "Cancel",
            callback_data: "cancel",
          }],
        ],
      },
      parse_mode: "Markdown",
    },
  );
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.SecondName;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
}

// Registration. Gender.
async function askGender(ctx: BotContext) {
  if (ctx.chat?.id && ctx.session.lastBotMessageId) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
  }
  const newMessage = await ctx.reply("What's your gender?", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Male 👦", callback_data: "MALE" }, {
          text: "Female 👧",
          callback_data: "FEMALE",
        }],
        [{ text: "Back", callback_data: "back" }, {
          text: "Cancel",
          callback_data: "cancel",
        }],
      ],
    },
    parse_mode: "Markdown",
  });
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.Gender;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
}

// Registration. Birthday.
async function askBirthday(ctx: BotContext) {
  if (ctx.chat?.id && ctx.session.lastBotMessageId) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
  }
  const newMessage = await ctx.reply(
    "When's your birthday\\? ||\\(DD\\.MM\\.YYYY\\)||",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "back" }, {
            text: "Cancel",
            callback_data: "cancel",
          }],
        ],
      },
      parse_mode: "MarkdownV2",
    },
  );
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.Birthday;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
}

// Registration. Bio.
async function askBio(ctx: BotContext) {
  if (ctx.chat?.id && ctx.session.lastBotMessageId) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
  }
  const newMessage = await ctx.reply(
    "Tell us briefly about yourself ||\\(256 characters\\)||",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "back" }, {
            text: "Cancel",
            callback_data: "cancel",
          }],
        ],
      },
      parse_mode: "MarkdownV2",
    },
  );
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.Bio;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
}

// Function for asking questions from distribution.
async function askField(ctx: BotContext) {
  if (
    ctx.session.fieldsIds !== undefined &&
    ctx.session.fieldCurrentIndex !== undefined && ctx.chat &&
    ctx.session.lastBotMessageId &&
    ctx.session.previousMessagesIdsForFields !== undefined
  ) {
    const currentFieldId: number =
      ctx.session.fieldsIds[ctx.session.fieldCurrentIndex];
    const currentField: FieldModel = await field(ctx.state, {
      fieldId: currentFieldId,
    });
    if (currentField.type === FieldType.TEXT) {
      ctx.session.fieldType = FieldType.TEXT;
      if (ctx.session.isFirstField === undefined) {
        const newMessage = await ctx.reply(currentField.question);
        ctx.session.lastBotMessageId = newMessage.message_id;
        ctx.session.previousMessagesIdsForFields.push(newMessage.message_id);
      } else {
        const newMessage = await ctx.reply(currentField.question, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Back", callback_data: "back_field" }],
            ],
          },
        });
        ctx.session.lastBotMessageId = newMessage.message_id;
        ctx.session.previousMessagesIdsForFields.push(newMessage.message_id);
      }
    } else if (currentField.type === FieldType.CHOICE) {
      const options: readonly string[] = currentField.options;
      ctx.session.fieldType = FieldType.CHOICE;
      if (ctx.session.isFirstField === undefined) {
        const newMessage = await ctx.reply(currentField.question, {
          reply_markup: {
            inline_keyboard: makeInlineKeyboard(options, false),
          },
        });
        ctx.session.lastBotMessageId = newMessage.message_id;
        ctx.session.previousMessagesIdsForFields.push(newMessage.message_id);
      } else {
        const newMessage = await ctx.reply(currentField.question, {
          reply_markup: {
            inline_keyboard: makeInlineKeyboard(options, true),
          },
        });
        ctx.session.lastBotMessageId = newMessage.message_id;
        ctx.session.previousMessagesIdsForFields.push(newMessage.message_id);
      }
    }
    ctx.session.isFirstField = 1;
  }
}

function getUserData(ctx: BotContext): string {
  const s =
    `Your name is ${ctx.session.userData?.name} ${ctx.session.userData?.surname}. You were born on ${ctx.session.userData?.birthday}, you are ${ctx.session.userData?.gender?.toString()}. You are known as a person who: ${ctx.session.userData?.bio}`;
  return s;
}

// Confirm editing.
async function editingConfirmation(ctx: BotContext) {
  const keyboard = [
    [{ text: "Edit profile", callback_data: "edit" }],
  ];
  const userData = getUserData(ctx);
  if (ctx.session.lastBotMessageId && ctx.chat?.id) {
    ctx.session.editingStep = EditingStep.Done;
    await ctx.reply(`${userData}`, {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  }
}

// Another function for editing.
async function editingBack(ctx: BotContext) {
  if (ctx.session.lastBotMessageId && ctx.chat?.id) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
  }
  if (ctx.session.userModel) {
    const userContext: UserContext = await createUserContext(
      ctx.state,
      ctx.session.userModel.id,
    );
    const distributionIds: Set<number> = await userDistributionsIds(
      userContext,
    );
    if (distributionIds.size >= 1) {
      const message = await ctx.reply("What information do you want to edit?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "First Name", callback_data: "edit_FirstName" }],
            [{ text: "Last Name", callback_data: "edit_SecondName" }],
            [{ text: "Birthday", callback_data: "edit_birthday" }],
            [{ text: "Bio", callback_data: "edit_bio" }],
            [{ text: "Back", callback_data: "cancel_back" }],
          ],
        },
      });
      ctx.session.lastBotMessageId = message.message_id;
    } else {
      const message = await ctx.reply("What information do you want to edit?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "First Name", callback_data: "edit_FirstName" }],
            [{ text: "Last Name", callback_data: "edit_SecondName" }],
            [{ text: "Gender", callback_data: "edit_gender" }],
            [{ text: "Birthday", callback_data: "edit_birthday" }],
            [{ text: "Bio", callback_data: "edit_bio" }],
            [{ text: "Back", callback_data: "cancel_back" }],
          ],
        },
      });
      ctx.session.lastBotMessageId = message.message_id;
    }

    ctx.session.editingStep = EditingStep.Done;
    ctx.session.registrationStep = RegistrationStep.Finish;
  }
}

// Composing ALL messages.
composer.on("message", async (ctx: BotContext) => {
  const step = ctx.session?.registrationStep;
  // Check if user want to edit something. Then check what exactly need to change.
  if (step == RegistrationStep.Editing) {
    {
      const step2 = ctx.session.editingStep;
      if (
        step2 == EditingStep.FirstNameEdition && ctx.session.lastBotMessageId
      ) {
        const name = ctx.message?.text;
        if (ctx.session.userData && ctx.chat) {
          await ctx.api.deleteMessage(
            ctx.chat.id,
            ctx.session.lastBotMessageId,
          );
          ctx.session.userData.name = name;
          const newMessage = await ctx.reply("Successfully edited!");
          editingConfirmation(ctx);
          ctx.session.lastBotMessageId = newMessage.message_id;
          ctx.session.editingStep = EditingStep.Done;
          ctx.session.registrationStep = RegistrationStep.Finish;
        } else {
          ctx.reply("Incorrect format. Try again (Name)");
        }
      }
      if (
        step2 == EditingStep.SecondNameEdition && ctx.session.lastBotMessageId
      ) {
        const name = ctx.message?.text;
        if (ctx.session.userData && ctx.chat) {
          await ctx.api.deleteMessage(
            ctx.chat.id,
            ctx.session.lastBotMessageId,
          );
          ctx.session.userData.surname = name;
          const newMessage = await ctx.reply("Successfully edited!");
          editingConfirmation(ctx);
          ctx.session.lastBotMessageId = newMessage.message_id;
          ctx.session.editingStep = EditingStep.Done;
          ctx.session.registrationStep = RegistrationStep.Finish;
        } else {
          ctx.reply("Incorrect format. Try again (Surname)");
        }
      } else if (step2 == EditingStep.BirthdayEdition) {
        const birthday = ctx.message?.text ? ctx.message?.text : "";
        if (
          isValidDate(birthday) && ctx.session.userData && ctx.chat &&
          ctx.session.lastBotMessageId
        ) {
          await ctx.api.deleteMessage(
            ctx.chat.id,
            ctx.session.lastBotMessageId,
          );
          ctx.session.userData.birthday = birthday;
          const newMessage = await ctx.reply("Successfully edited!");
          editingConfirmation(ctx);
          ctx.session.lastBotMessageId = newMessage.message_id;
          ctx.session.editingStep = EditingStep.Done;
          ctx.session.registrationStep = RegistrationStep.Finish;
        } else {
          const newMessage = await ctx.reply(
            "Incorrect format. Try again (DD.MM.YYYY)",
          );
          ctx.session.lastBotMessageId = newMessage.message_id;
        }
      } else if (
        step2 == EditingStep.BioEdition && ctx.session.userData && ctx.chat &&
        ctx.session.lastBotMessageId
      ) {
        await ctx.api.deleteMessage(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
        );
        ctx.session.userData.bio = ctx.message?.text;
        const newMessage = await ctx.reply("Successfully edited!");
        editingConfirmation(ctx);
        ctx.session.lastBotMessageId = newMessage.message_id;
        ctx.session.editingStep = EditingStep.Done;
        ctx.session.registrationStep = RegistrationStep.Finish;
      }
      if (ctx.session.editingStep === EditingStep.Done) {
        if (
          ctx.session.userModel?.id && ctx.session.userData?.name &&
          ctx.session.userData?.surname && ctx.session.userData?.gender &&
          ctx.session?.userData.birthday && ctx.session?.userData.bio
        ) {
          const userId = ctx.session.userModel.id;
          const userContext = await createUserContext(ctx.state, userId);
          if (typeof userContext === "object" && userContext !== null) {
            const bday = ctx.session.userData.birthday.split(".");

            const model: ProfileModel = {
              firstName: ctx.session.userData.name,
              lastName: ctx.session.userData.surname,
              gender: ctx.session.userData.gender,
              birthday: DateTimeScalar.parseValue(
                bday[2] + "-" + bday[1] + "-" + bday[0] + " 00:00:00",
              ),
              bio: ctx.session.userData.bio,
            };
            updateUserProfile(userContext, model);
          }
        }
        ctx.session.editingStep = undefined;
      }
    }
  } else if (step == RegistrationStep.FirstName) {
    // Registration STEPS.
    const name = ctx.message?.text?.split(" ");
    if (name && name?.length < 128) {
      ctx.session.userData = {
        name: name[0],
      };
      await askSecondName(ctx);
    } else {
      ctx.reply("Incorrect format. Try again (Name)", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Cancel", callback_data: "cancel" }],
          ],
        },
      });
    }
  } else if (step == RegistrationStep.SecondName) {
    const nameSurname = ctx.message?.text?.split(" ");
    if (nameSurname && nameSurname?.length < 128 && ctx.session.userData) {
      ctx.session.userData.surname = nameSurname[0];
      await askGender(ctx);
    } else {
      ctx.reply("Incorrect format. Try again (Surname)", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Back", callback_data: "back" }, {
              text: "Cancel",
              callback_data: "cancel",
            }],
          ],
        },
      });
    }
  } else if (step == RegistrationStep.Gender) {
    const newMessage = await ctx.reply("Click on the inline button :)");
    ctx.session.lastBotMessageId = newMessage.message_id;
  } else if (step == RegistrationStep.Birthday) {
    const birthday = ctx.message?.text ? ctx.message?.text : "";
    if (isValidDate(birthday) && ctx.session.userData) {
      ctx.session.userData.birthday = birthday;
      await askBio(ctx);
    } else {
      const newMessage = await ctx.reply(
        "Incorrect format. Try again (DD.MM.YYYY)",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Back", callback_data: "back" }, {
                text: "Cancel",
                callback_data: "cancel",
              }],
            ],
          },
        },
      );
      ctx.session.lastBotMessageId = newMessage.message_id;
    }
  } else if (
    step == RegistrationStep.Bio && ctx.session.userData && ctx.chat &&
    ctx.session.lastBotMessageId
  ) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
    ctx.session.userData.bio = ctx.message?.text;
    ctx.session.registrationStep = RegistrationStep.Finish;
    ctx.session.previousStep = RegistrationStep.Bio;
    const newMessage = await ctx.reply(
      `Nice to meet you, ${ctx.session.userData.name}!\nLet's finish the registration`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Confirm", callback_data: "confirm" }],
            [{ text: "Back", callback_data: "back" }, {
              text: "Cancel",
              callback_data: "cancel",
            }],
          ],
        },
      },
    );
    ctx.session.lastBotMessageId = newMessage.message_id;
  } else if (
    ctx.session.fieldStep === FieldStep.PROCESS && ctx.session.userModel &&
    ctx.session.fieldsIds && ctx.session.fieldCurrentIndex !== undefined &&
    ctx.message?.text && ctx.chat && ctx.session.lastBotMessageId &&
    ctx.session.removedFieldIds !== undefined
  ) {
    // If user answer on text field, then we also need to catch it there.
    const userContext: UserContext = await createUserContext(
      ctx.state,
      ctx.session.userModel.id,
    );
    await setTextAnswer(userContext, {
      fieldId: ctx.session.fieldsIds[ctx.session.fieldCurrentIndex],
      value: ctx.message?.text,
    });
    if (
      ctx.session.fieldsIds.length <= 1 &&
      ctx.session.distributionId !== undefined
    ) {
      const newMessage = await ctx.reply(
        "Yooo congratulations, you finished! Now use /feed",
      );
      await joinDistribution(userContext, {
        distributionId: ctx.session.distributionId,
      });
      ctx.session.lastBotMessageId = newMessage.message_id;
      ctx.session.fieldStep = FieldStep.FINISH;
      ctx.session.answeredQuestions = true;
    } else {
      ctx.session.removedFieldIds.push(ctx.session.fieldsIds[0]);
      ctx.session.fieldsIds.shift();
      await askField(ctx);
    }
  }
});

// Composing all inline clicks.
composer.on("callback_query:data", async (ctx: BotContext) => {
  const data = ctx.callbackQuery?.data;
  const step = ctx.session?.registrationStep;
  const step2 = ctx.session?.editingStep;
  // First of all, check back button
  if (
    data == "back" && ctx.session.registrationStep != undefined &&
    ctx.session.previousStep != undefined
  ) {
    ctx.session.registrationStep -= 1;
    ctx.session.previousStep -= 1;
    if (ctx.chat?.id && ctx.session.lastBotMessageId) {
      if (ctx.session.registrationStep === RegistrationStep.FirstName) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          "Enter your first name like __Ivan__",
          { parse_mode: "Markdown" },
        );
        await ctx.api.editMessageReplyMarkup(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Cancel", callback_data: "cancel" }],
              ],
            },
          },
        );
      } else if (ctx.session.registrationStep === RegistrationStep.SecondName) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          "Enter your surname like __Ivanov__",
          { parse_mode: "Markdown" },
        );
        await ctx.api.editMessageReplyMarkup(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Back", callback_data: "back" }, {
                  text: "Cancel",
                  callback_data: "cancel",
                }],
              ],
            },
          },
        );
      } else if (ctx.session.registrationStep === RegistrationStep.Gender) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          "Please, select your gender",
        );
        await ctx.api.editMessageReplyMarkup(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Male 👦", callback_data: "MALE" }, {
                  text: "Female 👧",
                  callback_data: "FEMALE",
                }],
                [{ text: "Back", callback_data: "back" }, {
                  text: "Cancel",
                  callback_data: "cancel",
                }],
              ],
            },
          },
        );
      } else if (ctx.session.registrationStep === RegistrationStep.Birthday) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          "When's your birthday\\? ||\\(DD\\.MM\\.YYYY\\)||",
          { parse_mode: "MarkdownV2" },
        );
        await ctx.api.editMessageReplyMarkup(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Back", callback_data: "back" }, {
                  text: "Cancel",
                  callback_data: "cancel",
                }],
              ],
            },
          },
        );
      } else if (ctx.session.registrationStep === RegistrationStep.Bio) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          "Tell us briefly about yourself ||\\(256 characters\\)||",
          { parse_mode: "MarkdownV2" },
        );
        await ctx.api.editMessageReplyMarkup(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Back", callback_data: "back" }, {
                  text: "Cancel",
                  callback_data: "cancel",
                }],
              ],
            },
          },
        );
      }
    }
  } else if (data === "cancel" && ctx.chat) {
    // Cancel button
    const newMessage = await ctx.reply(
      "Registration was cancelled. Click /start if you remind",
    );
    await ctx.api.sendAnimation(
      ctx.chat.id,
      CANCEL_GIF_ID,
    );
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.registrationStep = undefined;
    ctx.session.userData = undefined;
  } else if (data && step == RegistrationStep.Gender && ctx.session.userData) {
    if (data === "MALE") {
      ctx.session.userData.gender = Gender.MALE ? Gender.MALE : undefined;
    } else {
      ctx.session.userData.gender = Gender.FEMALE ? Gender.FEMALE : undefined;
    }
    await askBirthday(ctx);
  } else if (
    data && step2 == EditingStep.GenderEdition && ctx.session.userData &&
    (data === "MALE" || data === "FEMALE") && ctx.chat &&
    ctx.session.lastBotMessageId
  ) {
    ctx.api.deleteMessage(ctx.chat.id, ctx.session.lastBotMessageId);
    if (data === "MALE") {
      ctx.session.userData.gender = Gender.MALE ? Gender.MALE : undefined;
    } else {
      ctx.session.userData.gender = Gender.FEMALE ? Gender.FEMALE : undefined;
    }
    const newMessage = await ctx.reply("Successfully edited!");
    editingConfirmation(ctx);
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.editingStep = EditingStep.Done;
    ctx.session.registrationStep = RegistrationStep.Finish;
  } else if (
    data == "confirm" && ctx.session.userData && ctx.session.userData.gender &&
    ctx.session.userData.name &&
    ctx.session.userData.surname && ctx.session.userData.bio && ctx.chat?.id &&
    ctx.session.lastBotMessageId && ctx.session.userData.birthday
  ) {
    // Confirm button.
    const bday = ctx.session.userData.birthday.split(".");

    const model: ProfileModel = {
      firstName: ctx.session.userData.name,
      lastName: ctx.session.userData.surname,
      gender: ctx.session.userData.gender,
      birthday: DateTimeScalar.parseValue(
        bday[2] + "-" + bday[1] + "-" + bday[0] + " 00:00:00",
      ),
      bio: ctx.session.userData.bio,
    };

    if (ctx.from?.username) {
      ctx.session.registrationStep = RegistrationStep.Finish;
      ctx.session.previousStep = undefined;
      const userModel = await createUser(ctx.state, {
        telegramId: ctx.from.id,
        username: ctx.from.username,
        profile: model,
      });
      if (typeof userModel === "object" && userModel !== null) {
        ctx.session.userModel = userModel;
      }
      if (
        ctx.session.userModel?.id && ctx.session.userData?.name &&
        ctx.session.userData?.surname && ctx.session.userData?.gender &&
        ctx.session?.userData.birthday && ctx.session?.userData.bio
      ) {
        if (ctx.session.distributionId !== undefined) {
          await ctx.api.editMessageText(
            ctx.chat.id,
            ctx.session.lastBotMessageId,
            "Confirmed! Now you are registered, but need to answer some additional questions. Use /answer when you are ready",
          );
        } else {
          await ctx.api.editMessageText(
            ctx.chat.id,
            ctx.session.lastBotMessageId,
            "Confirmed! Now you are registered. Soon we will send you a link :)",
          );
        }
      }
    }
  } else if (
    data === "edit" && ctx.session.userModel && ctx.chat &&
    ctx.session.lastBotMessageId
  ) {
    // Edit button.
    await ctx.answerCallbackQuery({ text: "Editing profile..." });
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );

    const userContext: UserContext = await createUserContext(
      ctx.state,
      ctx.session.userModel.id,
    );
    const distributionIds: Set<number> = await userDistributionsIds(
      userContext,
    );
    if (distributionIds.size >= 1) {
      const message = await ctx.reply("What information do you want to edit?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "First Name", callback_data: "edit_FirstName" }],
            [{ text: "Last Name", callback_data: "edit_SecondName" }],
            [{ text: "Birthday", callback_data: "edit_birthday" }],
            [{ text: "Bio", callback_data: "edit_bio" }],
            [{ text: "Back", callback_data: "cancel_back" }],
          ],
        },
      });
      ctx.session.lastBotMessageId = message.message_id;
    } else {
      const message = await ctx.reply("What information do you want to edit?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "First Name", callback_data: "edit_FirstName" }],
            [{ text: "Last Name", callback_data: "edit_SecondName" }],
            [{ text: "Gender", callback_data: "edit_gender" }],
            [{ text: "Birthday", callback_data: "edit_birthday" }],
            [{ text: "Bio", callback_data: "edit_bio" }],
            [{ text: "Back", callback_data: "cancel_back" }],
          ],
        },
      });
      ctx.session.lastBotMessageId = message.message_id;
    }
  } else if (
    data === "edit_FirstName" && ctx.session.lastBotMessageId && ctx.chat?.id
  ) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
    const newMessage = await ctx.reply("Enter your new name:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "edit_back" }, {
            text: "Cancel",
            callback_data: "cancel_back",
          }],
        ],
      },
    });
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.registrationStep = RegistrationStep.Editing;
    ctx.session.editingStep = EditingStep.FirstNameEdition;
  } else if (
    data === "edit_SecondName" && ctx.session.lastBotMessageId && ctx.chat?.id
  ) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
    const newMessage = await ctx.reply("Enter your new surname:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "edit_back" }, {
            text: "Cancel",
            callback_data: "cancel_back",
          }],
        ],
      },
    });
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.registrationStep = RegistrationStep.Editing;
    ctx.session.editingStep = EditingStep.SecondNameEdition;
  } else if (
    data === "edit_gender" && ctx.session.lastBotMessageId && ctx.chat?.id
  ) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
    const newMessage = await ctx.reply("Select your new gender:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Male", callback_data: "MALE" }, {
            text: "Female",
            callback_data: "FEMALE",
          }],
          [{ text: "Back", callback_data: "edit_back" }, {
            text: "Cancel",
            callback_data: "cancel_back",
          }],
        ],
      },
    });
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.editingStep = EditingStep.GenderEdition;
    ctx.session.registrationStep = RegistrationStep.Editing;
  } else if (
    data === "edit_birthday" && ctx.session.lastBotMessageId && ctx.chat?.id
  ) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
    const newMessage = await ctx.reply(
      "When's your birthday\\? ||\\(DD\\.MM\\.YYYY\\)||",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Back", callback_data: "back" }, {
              text: "Cancel",
              callback_data: "cancel",
            }],
          ],
        },
        parse_mode: "MarkdownV2",
      },
    );
    ctx.session.editingStep = EditingStep.BirthdayEdition;
    ctx.session.registrationStep = RegistrationStep.Editing;
    ctx.session.lastBotMessageId = newMessage.message_id;
  } else if (
    data === "edit_bio" && ctx.session.lastBotMessageId && ctx.chat?.id
  ) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
    const newMessage = await ctx.reply("Enter your new bio:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "edit_back" }, {
            text: "Cancel",
            callback_data: "cancel_back",
          }],
        ],
      },
    });
    ctx.session.registrationStep = RegistrationStep.Editing;
    ctx.session.editingStep = EditingStep.BioEdition;
    ctx.session.lastBotMessageId = newMessage.message_id;
  } else if (data === "edit_back" && ctx.session.lastBotMessageId) {
    editingBack(ctx);
    ctx.session.registrationStep = RegistrationStep.Finish;
    ctx.session.editingStep = EditingStep.Done;
  } else if (data === "cancel_back" && ctx.session.lastBotMessageId) {
    editingConfirmation(ctx);
    ctx.session.registrationStep = RegistrationStep.Finish;
    ctx.session.editingStep = EditingStep.Done;
  } else if (data === "profile" && ctx.chat && ctx.session.lastBotMessageId) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
    const userData = getUserData(ctx);
    const keyboard = [
      [{ text: "Edit profile", callback_data: "edit" }],
    ];

    const newMessage = await ctx.reply(`${userData}`, {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });

    ctx.session.lastBotMessageId = newMessage.message_id;
  } else if (
    data === "back_field" && ctx.session.removedFieldIds !== undefined &&
    ctx.session.removedFieldIds.length >= 1 && ctx.session.fieldsIds &&
    ctx.chat && ctx.session.fieldStep === FieldStep.PROCESS &&
    ctx.session.removedFieldIds !== undefined &&
    ctx.session.removedFieldIds.length > 0 &&
    ctx.session.previousMessagesIdsForFields &&
    ctx.session.previousMessagesIdsForFields.length >= 2
  ) {
    for (let j = 0; j < 2; j++) {
      await ctx.api.deleteMessage(
        ctx.chat.id,
        ctx.session
          .previousMessagesIdsForFields[
            ctx.session.previousMessagesIdsForFields.length - 1
          ],
      );
      ctx.session.previousMessagesIdsForFields.pop();
    }
    const a = ctx.session.removedFieldIds.pop();
    if (a !== undefined) {
      ctx.session.fieldsIds.unshift(a);
    }
    if (ctx.session.removedFieldIds.length === 0) {
      ctx.session.isFirstField = undefined;
    }
    await askField(ctx);
  } else if (
    ctx.session.fieldStep === FieldStep.PROCESS &&
    ctx.session.fieldsIds && ctx.session.fieldCurrentIndex !== undefined
  ) {
    // We also need to catch answer for fields there.
    const currentFieldId: number =
      ctx.session.fieldsIds[ctx.session.fieldCurrentIndex];
    const currentField: FieldModel = await field(ctx.state, {
      fieldId: currentFieldId,
    });
    if (currentField.type === FieldType.CHOICE) {
      const options: readonly string[] = currentField.options;
      let index = -1;
      for (let i = 0; i < options.length; i++) {
        if (data === options[i]) {
          index = i;
        }
      }
      if (
        index !== -1 && ctx.session.userModel && ctx.session.lastBotMessageId &&
        ctx.chat && ctx.session.removedFieldIds !== undefined
      ) {
        const userContext: UserContext = await createUserContext(
          ctx.state,
          ctx.session.userModel.id,
        );
        const ans: readonly number[] = [index];
        await setChoiceAnswer(userContext, {
          fieldId: currentFieldId,
          indices: ans,
        });
        await ctx.api.editMessageReplyMarkup(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          {
            reply_markup: undefined,
          },
        );
        if (
          ctx.session.fieldsIds.length <= 1 &&
          ctx.session.distributionId !== undefined
        ) {
          await ctx.reply("Yooo congratulations, you finished! Now use /feed");
          ctx.session.fieldStep = FieldStep.FINISH;
          ctx.session.answeredQuestions = true;
          await joinDistribution(userContext, {
            distributionId: ctx.session.distributionId,
          });
        } else {
          ctx.session.removedFieldIds.push(ctx.session.fieldsIds[0]);
          ctx.session.fieldsIds.shift();
          await askField(ctx);
        }
      }
    }
  }
});
