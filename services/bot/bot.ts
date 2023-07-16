import { Composer } from "../../deps.ts";
import { DateTimeScalar } from "../../services/graphql/scalar/datetime.ts";
import type { BotContext } from "../../types.ts";
import { difference } from "../../utils/iter.ts";
import {
  setChoiceAnswer,
  setTextAnswer,
} from "../database/operation/answer.ts";
import { field, fields } from "../database/operation/field.ts";
import {
  createUser,
  updateUserProfile,
  userDistributionsIds,
  userFieldIds,
} from "../database/operation/user.ts";
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

export const composer = new Composer<BotContext>();

// TODO(Junkyyz): validation (name, surname, age -> birthday, bio, etc.) Including validation for answers (from fields)
// TODO(Junkyyz): database -> assert -> [user / field / answer]
// TODO(Junkyyz): Split name -> name and last name. Two questions.

composer.command("start", async (ctx: BotContext) => {
  if (!ctx.from?.username) {
    await ctx.reply(
      "Oops, wait. We can't detect your @username. Please go into the settings and fix it",
    );
  } else if (ctx.session.registrationStep !== RegistrationStep.Finish) {
    const newMessage = await ctx.reply(
      "Hi, here we will help you to find the perfect roommates.",
      { parse_mode: "Markdown" },
    );
    ctx.session.lastBotMessageId = newMessage.message_id;
    await askFirstName(ctx);
  } else {
    const keyboard = [
      [{ text: "Open profile", callback_data: "profile" }],
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
});

composer.command("profile", async (ctx: BotContext) => {
  if (
    ctx.session.registrationStep === RegistrationStep.Finish &&
    ctx.session.fieldStep == FieldStep.FINISH
  ) {
    const userData = getUserData(ctx);
    const keyboard = [
      [{ text: "Edit Info", callback_data: "edit" }],
    ];

    const newMessage = await ctx.reply(`Your profile data:\n${userData}`, {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });

    ctx.session.lastBotMessageId = newMessage.message_id;
  } else {
    await ctx.reply(
      "*Wow, wow, wow\\. Slow down\\! At first, you need to register\\. Use /start :\\)*",
      { parse_mode: "MarkdownV2" },
    );
  }
});

composer.command("focuspocus", async (ctx: BotContext) => {
  ctx.session.registrationStep = undefined;
  ctx.session.userData = undefined;
  await ctx.reply("Done.");
});

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
          [{ text: "Cancel", callback_data: "cancel" }],
        ],
      },
      parse_mode: "Markdown",
    },
  );
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.SecondName;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
}

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
        [{ text: "Male👦", callback_data: "MALE" }, {
          text: "Female👧",
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

async function askField(ctx: BotContext) {
  if (
    ctx.session.fieldsIds !== undefined &&
    ctx.session.fieldCurrentIndex !== undefined
  ) {
    const currentFieldId: number =
      ctx.session.fieldsIds[ctx.session.fieldCurrentIndex];
    const currentField: FieldModel = await field(ctx.state, {
      fieldId: currentFieldId,
    });
    ctx.session.currentField = currentField;
    if (currentField.type === FieldType.TEXT) {
      const newMessage = await ctx.reply(currentField.question);
      ctx.session.lastBotMessageId = newMessage.message_id;
      ctx.session.fieldType = FieldType.TEXT;
      ctx.session.lastBotMessageId = newMessage.message_id;
    } else if (currentField.type === FieldType.CHOICE) {
      const options: readonly string[] = currentField.options;
      const newMessage = await ctx.reply(currentField.question, {
        reply_markup: {
          inline_keyboard: makeInlineKeyboard(options),
        },
      });
      ctx.session.lastBotMessageId = newMessage.message_id;
    }
  }
}

function getUserData(ctx: BotContext): string {
  const s =
    `Your name is ${ctx.session.userData?.name} ${ctx.session.userData?.surname}.
You were born on ${ctx.session.userData?.birthday}, you are ${ctx.session.userData?.gender?.toString()}.
You are known as a person who:

${ctx.session.userData?.bio}`;
  return s;
}

async function editingConfirmation(ctx: BotContext) {
  const keyboard = [
    [{ text: "Edit Info", callback_data: "edit" }],
  ];
  const userData = getUserData(ctx);
  if (ctx.session.lastBotMessageId && ctx.chat?.id) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
    ctx.session.editingStep = EditingStep.Done;
    const newMessage = await ctx.reply(`${userData}`, {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
    ctx.session.lastBotMessageId = newMessage.message_id;
  }
}

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
    if (distributionIds.size > 1) {
      const message = await ctx.reply("What information do you want to edit?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "First Name", callback_data: "edit_FirstName" }],
            [{ text: "Second Name", callback_data: "edit_SecondName" }],
            [{ text: "Date of Birthday", callback_data: "edit_birthday" }],
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
            [{ text: "Second Name", callback_data: "edit_SecondName" }],
            [{ text: "Gender", callback_data: "edit_gender" }],
            [{ text: "Date of Birthday", callback_data: "edit_birthday" }],
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

composer.on("message", async (ctx: BotContext) => {
  const step = ctx.session?.registrationStep;
  if (step == RegistrationStep.Editing) {
    {
      const step2 = ctx.session.editingStep;
      if (
        step2 == EditingStep.FirstNameEdition && ctx.session.lastBotMessageId
      ) {
        const name = ctx.message?.text;
        if (ctx.session.userData) {
          ctx.session.userData.name = name;
          editingConfirmation(ctx);
          const newMessage = await ctx.reply("Successfully edited!");
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
        if (ctx.session.userData) {
          ctx.session.userData.surname = name;
          editingConfirmation(ctx);
          const newMessage = await ctx.reply("Successfully edited!");
          ctx.session.lastBotMessageId = newMessage.message_id;
          ctx.session.editingStep = EditingStep.Done;
          ctx.session.registrationStep = RegistrationStep.Finish;
        } else {
          ctx.reply("Incorrect format. Try again (Surname)");
        }
      } else if (step2 == EditingStep.BirthdayEdition) {
        const birthday = ctx.message?.text ? ctx.message?.text : "";
        if (isValidDate(birthday) && ctx.session.userData) {
          ctx.session.userData.birthday = birthday;
          editingConfirmation(ctx);
          const newMessage = await ctx.reply("Successfully edited!");
          ctx.session.lastBotMessageId = newMessage.message_id;
          ctx.session.editingStep = EditingStep.Done;
          ctx.session.registrationStep = RegistrationStep.Finish;
        } else {
          const newMessage = await ctx.reply(
            "Incorrect format. Try again (DD.MM.YYYY)",
          );
          ctx.session.lastBotMessageId = newMessage.message_id;
        }
      } else if (step2 == EditingStep.BioEdition && ctx.session.userData) {
        ctx.session.userData.bio = ctx.message?.text;
        editingConfirmation(ctx);
        const newMessage = await ctx.reply("Successfully edited!");
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
          } else {
            // TODO(Junkyyz): Write error.
          }
        }
      }
    }
  } else if (step == RegistrationStep.FirstName) {
    const name = ctx.message?.text?.split(" ");
    //TODO(Junkyyz): validation
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
    //TODO(Junkyyz): validation!!!
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
  } else if (step == RegistrationStep.Bio && ctx.session.userData) {
    ctx.session.userData.bio = ctx.message?.text;
    ctx.session.registrationStep = RegistrationStep.Finish;
    ctx.session.previousStep = RegistrationStep.Bio;
    const newMessage = await ctx.reply(
      `Nice to meet you, ${ctx.session.userData.name}!\nLet's finish the registration.`,
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
    ctx.message?.text
  ) {
    const userContext: UserContext = await createUserContext(
      ctx.state,
      ctx.session.userModel.id,
    );
    setTextAnswer(userContext, {
      fieldId: ctx.session.fieldsIds[ctx.session.fieldCurrentIndex],
      value: ctx.message?.text,
    });
    ctx.session.fieldCurrentIndex += 1;
    if (ctx.session.fieldCurrentIndex === ctx.session.fieldAmount) {
      const newMessage = await ctx.reply("You finished!! Now use /profile.");
      ctx.session.lastBotMessageId = newMessage.message_id;
      ctx.session.fieldStep = FieldStep.FINISH;
    } else {
      askField(ctx);
    }
  }
});

composer.on("callback_query:data", async (ctx: BotContext) => {
  const data = ctx.callbackQuery?.data;
  const step = ctx.session?.registrationStep;
  const step2 = ctx.session?.editingStep;
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
          "Please, select your gender.",
        );
        await ctx.api.editMessageReplyMarkup(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Male👦", callback_data: "MALE" }, {
                  text: "Female👧",
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
  } else if (data === "cancel") {
    const newMessage = await ctx.reply(
      "Registration was cancelled. Click /start if you remind.",
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
    (data === "MALE" || data === "FEMALE")
  ) {
    if (data === "MALE") {
      ctx.session.userData.gender = Gender.MALE ? Gender.MALE : undefined;
    } else {
      ctx.session.userData.gender = Gender.FEMALE ? Gender.FEMALE : undefined;
    }
    editingConfirmation(ctx);
    ctx.session.editingStep = EditingStep.Done;
    ctx.session.registrationStep = RegistrationStep.Finish;
  } else if (
    data == "confirm" && ctx.session.userData && ctx.session.userData.gender &&
    ctx.session.userData.name &&
    ctx.session.userData.surname && ctx.session.userData.bio && ctx.chat?.id &&
    ctx.session.lastBotMessageId && ctx.session.userData.birthday
  ) {
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
      } else {
        // TODO(Azaki-san / Junkyyz): something went wrong. Write error.
      }

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
        if (typeof userContext === "object" && userContext !== null) {
          const answeredIds: Set<number> = await userFieldIds(
            userContext,
          );
          const allFields: FieldModel[] = await fields(
            ctx.state,
          );
          const allFieldsIds: Set<number> = new Set();
          for (let i = 0; i < allFields.length; i++) {
            allFieldsIds.add(allFields[i].id);
          }
          const needToAnswerFieldIds: Set<number> = difference<number>(
            answeredIds,
            allFieldsIds,
          );
          ctx.session.fieldsIds = [...needToAnswerFieldIds];
          ctx.session.fieldAmount = ctx.session.fieldsIds.length;
          // iterate through needToAnswerFieldIds, get Field.
          if (needToAnswerFieldIds && ctx.session.fieldAmount > 0) {
            await ctx.api.editMessageText(
              ctx.chat.id,
              ctx.session.lastBotMessageId,
              "Confirmed! Now you are registered, but also you need to answer some questions about personality. Please, answer honestly :)\nLet's start now!!",
            );
            await askField(ctx);
          } else {
            await ctx.api.editMessageText(
              ctx.chat.id,
              ctx.session.lastBotMessageId,
              "Confirmed! Now you are registered.",
            );
            ctx.session.fieldStep = FieldStep.FINISH;
          }
        } else {
          // TODO(Junkyyz): Write error.
        }
      }
    } else {
      // TODO(junkyyz): ask for a permission
    }
  } else if (data === "edit" && ctx.session.userModel) {
    await ctx.answerCallbackQuery({ text: "Editing profile..." });

    const userContext: UserContext = await createUserContext(
      ctx.state,
      ctx.session.userModel.id,
    );
    const distributionIds: Set<number> = await userDistributionsIds(
      userContext,
    );
    if (distributionIds.size > 1) {
      const message = await ctx.reply("What information do you want to edit?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "First Name", callback_data: "edit_FirstName" }],
            [{ text: "Second Name", callback_data: "edit_SecondName" }],
            [{ text: "Date of Birthday", callback_data: "edit_birthday" }],
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
            [{ text: "Second Name", callback_data: "edit_SecondName" }],
            [{ text: "Gender", callback_data: "edit_gender" }],
            [{ text: "Date of Birthday", callback_data: "edit_birthday" }],
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
  } else if (data === "profile") {
    const userData = getUserData(ctx);
    const keyboard = [
      [{ text: "Edit Info", callback_data: "edit" }],
    ];

    const newMessage = await ctx.reply(`${userData}`, {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
    console.log(ctx.session.userModel);

    ctx.session.lastBotMessageId = newMessage.message_id;
  } else if (
    ctx.session.fieldStep === FieldStep.PROCESS && ctx.session.currentField &&
    ctx.session.currentField.type == FieldType.CHOICE &&
    ctx.session.fieldsIds && ctx.session.fieldCurrentIndex !== undefined
  ) {
    const currentFieldId: number =
      ctx.session.fieldsIds[ctx.session.fieldCurrentIndex];
    const currentField: FieldModel = ctx.session.currentField;
    const options: readonly string[] = currentField.options;
    let index = -1;
    for (let i = 0; i < options.length; i++) {
      if (data === options[i]) {
        index = i;
      }
    }
    if (
      index !== -1 && ctx.session.userModel && ctx.session.lastBotMessageId &&
      ctx.chat
    ) {
      const userContext: UserContext = await createUserContext(
        ctx.state,
        ctx.session.userModel.id,
      );
      const ans: readonly number[] = [index];
      setChoiceAnswer(userContext, { fieldId: currentFieldId, indices: ans });
      ctx.session.fieldCurrentIndex += 1;
      if (ctx.session.fieldCurrentIndex === ctx.session.fieldAmount) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          "You finished!! Now use /profile.",
        );
        await ctx.api.editMessageReplyMarkup(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          {
            reply_markup: {
              inline_keyboard: [
                [],
              ],
            },
          },
        );
        ctx.session.fieldStep = FieldStep.FINISH;
      } else {
        askField(ctx);
      }
    } else {
      // TODO(Azaki-san/Junkyyz): Error Message.
    }
  }
});
