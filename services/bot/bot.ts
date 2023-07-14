import { Composer, session } from "../../deps.ts";
import { ProfileModel, UserModel, Gender, createUserContext, UserContext, isValidDate, createUser, updateUserProfile, userFieldIds, fields, field, difference, setTextAnswer,
  FieldModel, FieldType} from "./mod.ts";
import { DateTimeScalar } from "../../services/graphql/scalar/datetime.ts";
import type { BotContext } from "../../types.ts";
import { EditingStep, RegistrationStep, SessionData, FieldStep } from "./types.ts";

export const composer = new Composer<BotContext>();

const sessionMiddleware = session<SessionData, BotContext>({
  initial: () => ({}),
});

composer.use(sessionMiddleware);
// TODO(Junkyyz): validation (name, surname, age -> birthday, bio, etc.) Including validation for answers (from fields)
// TODO(Junkyyz): database -> assert -> [user / field / answer]
// TODO(Junkyyz): Split name -> name and last name. Two questions.

composer.command("start", async (ctx: BotContext) => {
  if (!ctx.from?.username) {
    await ctx.reply("*Hey hey\\! Before starting using the bot, please add your alias \\(username\\) in the telegram profile settings\\.*",
    { parse_mode: "MarkdownV2" },
    );
  } else if (ctx.session.registrationStep !== RegistrationStep.Finish) {
    const newMessage = await ctx.reply(
      "*Welcome to the _Randorm_\\ \\- the place where you will find your best roommates\\.\nLet's register you in the bot \\=\\)*",
      { parse_mode: "MarkdownV2" },
    );
    ctx.session.lastBotMessageId = newMessage.message_id;
    await askFirstName(ctx);
  } else {
    const newMessage = await ctx.reply(
      "You are already registered. Use /profile :)",
    );
    ctx.session.lastBotMessageId = newMessage.message_id;
  }
});

composer.command("profile", async (ctx: BotContext) => {
  if (ctx.session.registrationStep === RegistrationStep.Finish && ctx.session.fieldStep == FieldStep.FINISH) {
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
  await ctx.reply("*Wow, wow, wow\\. Slow down\\! At first, you need to register\\. Use /start :\\)*",
  {parse_mode: "MarkdownV2"});
}
});

async function askFirstName(ctx: BotContext) {
  const newMessage = await ctx.reply(
    "Enter your name like _Name_",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Cancel", callback_data: "cancel" }],
        ],
      },
      parse_mode: "MarkdownV2",
    },
  );
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.FirstName;
}

async function askSecondName(ctx: BotContext) {
  console.log(ctx.session.userData);
  const newMessage = await ctx.reply(
    "Enter your surname like _Surname_",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Cancel", callback_data: "cancel" }],
        ],
      },
      parse_mode: "MarkdownV2",
    },
  );
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.SecondName;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
  console.log(ctx.session.userData);
}

async function askGender(ctx: BotContext) {
  const newMessage = await ctx.reply("Please, select your gender.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Male", callback_data: "MALE" }],
        [{ text: "Female", callback_data: "FEMALE" }],
        [{ text: "Back", callback_data: "back" }],
        [{ text: "Cancel", callback_data: "cancel" }],
      ],
    },
  });
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.Gender;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
}

async function askBirthday(ctx: BotContext) {
  const newMessage = await ctx.reply(
    "Enter your date of birthday (YYYY-MM-DD).",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "back" }],
          [{ text: "Cancel", callback_data: "cancel" }],
        ],
      },
    },
  );
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.Birthday;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
}

async function askBio(ctx: BotContext) {
  const newMessage = await ctx.reply("Enter your bio (a few sentences).", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Back", callback_data: "back" }],
        [{ text: "Cancel", callback_data: "cancel" }],
      ],
    },
  });
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.Bio;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
}

async function askField(ctx: BotContext) {
  if (ctx.session.fieldsIds && ctx.session.fieldCurrentIndex) {
    const currentFieldId: number = ctx.session.fieldsIds[ctx.session.fieldCurrentIndex];
    const currentField: FieldModel = field(ctx.state, { fieldId: currentFieldId }) as unknown as FieldModel;
    if (currentField.type === FieldType.TEXT) {
      const newMessage = await ctx.reply(currentField.format + "\n" + currentField.sample);
      ctx.session.lastBotMessageId = newMessage.message_id;
      ctx.session.fieldType = FieldType.TEXT;
    } else if (currentField.type === FieldType.CHOICE) {
      //TODO(Azaki-san/Junkyyz): add FieldType.CHOICE functionality.
      console.log(1);
    }
  }
}

function getUserData(ctx: BotContext): string {
  const s = `Name: ${ctx.session.userData?.name}
Surname: ${ctx.session.userData?.surname}
Gender: ${ctx.session.userData?.gender?.toString()}
Date of birthday: ${ctx.session.userData?.birthday}
Bio: ${ctx.session.userData?.bio}\n
`;
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
    const newMessage = await ctx.reply(`Your profile data:\n${userData}`, {
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
  ctx.session.editingStep = EditingStep.Done;
  ctx.session.registrationStep = RegistrationStep.Finish;
  ctx.session.lastBotMessageId = message.message_id;
}

composer.on("message", async (ctx: BotContext) => {
  const step = ctx.session?.registrationStep;
  console.log(ctx.session.userData);
  if (step == RegistrationStep.Editing) {
    {
      const step2 = ctx.session.editingStep;
      if (step2 == EditingStep.FirstNameEdition && ctx.session.lastBotMessageId) {
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
      if (step2 == EditingStep.SecondNameEdition && ctx.session.lastBotMessageId) {
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
      }
      else if (step2 == EditingStep.BirthdayEdition) {
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
        if (ctx.session.userModel?.id && ctx.session.userData?.name && ctx.session.userData?.surname && ctx.session.userData?.gender && ctx.session?.userData.birthday && ctx.session?.userData.bio) {
          const userId = ctx.session.userModel.id;
          const userContextTemp = createUserContext(ctx.state, userId);
          if (typeof userContextTemp === 'object' && userContextTemp !== null) {
            const userContext: UserContext = userContextTemp as unknown as UserContext;
            const model: ProfileModel = {firstName: ctx.session.userData.name, lastName: ctx.session.userData.surname,
              gender: ctx.session.userData.gender, birthday: DateTimeScalar.parseValue(ctx.session.userData.birthday + " 00:00:00"),
             bio: ctx.session.userData.bio};
            updateUserProfile(userContext, model)
          } else {
            // TODO(Junkyyz): Write error.
          }
        }
      }
    }
  } else if (step == RegistrationStep.FirstName) {
      const name = ctx.message?.text?.split(" ");
      if (name?.length == 1) {
        ctx.session.userData = {
          name: name[0],
        };
        console.log(name);
        console.log(ctx.session.userData);
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
    }else if (step == RegistrationStep.SecondName) {
      console.log(ctx.session.userData);
      const nameSurname = ctx.message?.text?.split(" ");
      if (nameSurname?.length == 1 && ctx.session.userData) {
        ctx.session.userData.surname = nameSurname[0];
        await askGender(ctx);
      } else {
        ctx.reply("Incorrect format. Try again (Surname)", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Cancel", callback_data: "cancel" }],
            ],
          },
        });
      }
    }
     else if (step == RegistrationStep.Gender) {
      const newMessage = await ctx.reply("Click on the inline button :)");
      ctx.session.lastBotMessageId = newMessage.message_id;
    } else if (step == RegistrationStep.Birthday) {
      const birthday = ctx.message?.text ? ctx.message?.text : "";
      if (isValidDate(birthday) && ctx.session.userData) {
        ctx.session.userData.birthday = birthday;
        await askBio(ctx);
      } else {
        const newMessage = await ctx.reply(
          "Incorrect format. Try again (YYYY-MM-DD)",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Back", callback_data: "back" }],
                [{ text: "Cancel", callback_data: "cancel" }],
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
      const s = getUserData(ctx);
      const newMessage = await ctx.reply(
        `Your information profile:\n${s}Confirm?`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Confirm", callback_data: "confirm" }],
              [{ text: "Back", callback_data: "back" }],
              [{ text: "Cancel", callback_data: "cancel" }],
            ],
          },
        },
      );
      ctx.session.lastBotMessageId = newMessage.message_id;
    } 
    else if (ctx.session.fieldStep === FieldStep.PROCESS && ctx.session.userModel && ctx.session.fieldsIds && ctx.session.fieldCurrentIndex && ctx.message?.text) {
      const userContext: UserContext = createUserContext(ctx.state, ctx.session.userModel.id) as unknown as UserContext;
      setTextAnswer(userContext, { fieldId: ctx.session.fieldsIds[ctx.session.fieldCurrentIndex], value: ctx.message?.text });
      ctx.session.fieldCurrentIndex += 1;
      if (ctx.session.fieldCurrentIndex === ctx.session.fieldAmount) {
        const newMessage = await ctx.reply("You finished!! Now use /profile.");
        ctx.session.lastBotMessageId = newMessage.message_id;
        ctx.session.fieldStep = FieldStep.FINISH;
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
          "Enter your name like _Name_",
          { parse_mode: "MarkdownV2" },
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
      } 
      else if (ctx.session.registrationStep === RegistrationStep.SecondName) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          "Enter your surname like _Surname_",
          { parse_mode: "MarkdownV2" },
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
      } 
      else if (ctx.session.registrationStep === RegistrationStep.Gender) {
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
                [{ text: "Male", callback_data: "MALE" }],
                [{ text: "Female", callback_data: "FEMALE" }],
                [{ text: "Back", callback_data: "back" }],
                [{ text: "Cancel", callback_data: "cancel" }],
              ],
            },
          },
        );
      } else if (ctx.session.registrationStep === RegistrationStep.Birthday) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          "Enter your date of birthday (DD.MM.YYYY).",
        );
        await ctx.api.editMessageReplyMarkup(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Back", callback_data: "back" }],
                [{ text: "Cancel", callback_data: "cancel" }],
              ],
            },
          },
        );
      } else if (ctx.session.registrationStep === RegistrationStep.Bio) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          "Enter your bio (a few sentences).",
        );
        await ctx.api.editMessageReplyMarkup(
          ctx.chat.id,
          ctx.session.lastBotMessageId,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Back", callback_data: "back" }],
                [{ text: "Cancel", callback_data: "cancel" }],
              ],
            },
          },
        );
      }
    }
  } else if (data == "cancel") {
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
    ctx.session.lastBotMessageId
  ) {
    ctx.session.registrationStep = RegistrationStep.Finish;
    ctx.session.previousStep = undefined;
    ctx.session.fieldStep = FieldStep.FINISH;
    await ctx.api.editMessageText(
                ctx.chat.id,
                ctx.session.lastBotMessageId,
                "Confirmed! Now you are registered. /profile",
              );
    ctx.session.fieldCurrentIndex = 0;
    // TODO(Azaki-san/Junkyyz): get fields.
    if (ctx.session.userModel?.id && ctx.session.userData?.name && ctx.session.userData?.surname && ctx.session.userData?.gender && ctx.session?.userData.birthday && ctx.session?.userData.bio) {
        const userId = ctx.session.userModel.id;
        const userContextTemp = createUserContext(ctx.state, userId);
        if (typeof userContextTemp === 'object' && userContextTemp !== null) {
          const userContext: UserContext = userContextTemp as unknown as UserContext;
          const answeredIds: Set<number> = userFieldIds(userContext) as unknown as Set<number>;
          const allFields: FieldModel[] = fields(ctx.state) as unknown as FieldModel[];
          let allFieldsIds: Set<number> = new Set();
          for (let i = 0; i < allFields.length; i++) {
              allFieldsIds.add(allFields[i].id);
          }
          const needToAnswerFieldIds: Set<number> = difference<number>(answeredIds, allFieldsIds);
          ctx.session.fieldsIds = [...needToAnswerFieldIds];
          ctx.session.fieldAmount = ctx.session.fieldsIds.length;
          // iterate through needToAnswerFieldIds, get Field.
          if (needToAnswerFieldIds) {
            await ctx.api.editMessageText(
              ctx.chat.id,
              ctx.session.lastBotMessageId,
              "Confirmed! Now you are registered, but also you need to answer some questions about personality. Please, answer honestly :)\nLet's start now!!",
            );
            await askField(ctx);
          }
        } else {
          // TODO(Junkyyz): Write error.
        }
      }
    
    const model: ProfileModel = {
      firstName: ctx.session.userData.name,
      lastName: ctx.session.userData.surname,
      gender: ctx.session.userData.gender,
      birthday: DateTimeScalar.parseValue(
        ctx.session.userData.birthday + " 00:00:00",
      ),
      bio: ctx.session.userData.bio,
    };

    if (ctx.from?.username) {
      const result = await createUser(ctx.state, {
        telegramId: ctx.from.id,
        username: ctx.from.username,
        profile: model,
      });
      if (typeof result === 'object' && result !== null) {
        const userModel = result as UserModel;
        ctx.session.userModel = userModel;
      } else {
        // TODO(Azaki-san / Junkyyz): something went wrong. Write error.
      }
    } else {
      // TODO(Azaki-san): ask for a permission
    }
  } else if (data === "edit") {
    await ctx.answerCallbackQuery({ text: "Editing profile..." });

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
          [{ text: "Back", callback_data: "edit_back" }],
          [{ text: "Cancel", callback_data: "cancel_back" }],
        ],
      },
    });
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.registrationStep = RegistrationStep.Editing;
    ctx.session.editingStep = EditingStep.FirstNameEdition;
    console.log(ctx.session.editingStep);
  }
  else if (
    data === "edit_SecondName" && ctx.session.lastBotMessageId && ctx.chat?.id
  ) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
    const newMessage = await ctx.reply("Enter your new surname:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "edit_back" }],
          [{ text: "Cancel", callback_data: "cancel_back" }],
        ],
      },
    });
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.registrationStep = RegistrationStep.Editing;
    ctx.session.editingStep = EditingStep.SecondNameEdition;
    console.log(ctx.session.editingStep);
  }
  else if (
    data === "edit_gender" && ctx.session.lastBotMessageId && ctx.chat?.id
  ) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.session.lastBotMessageId,
    );
    const newMessage = await ctx.reply("Select your new gender:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Male", callback_data: "MALE" }],
          [{ text: "Female", callback_data: "FEMALE" }],
          [{ text: "Back", callback_data: "edit_back" }],
          [{ text: "Cancel", callback_data: "cancel_back" }],
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
      "Enter your new date of birthday (YYYY-MM-DD):",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Back", callback_data: "edit_back" }],
            [{ text: "Cancel", callback_data: "cancel_back" }],
          ],
        },
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
          [{ text: "Back", callback_data: "edit_back" }],
          [{ text: "Cancel", callback_data: "cancel_back" }],
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
  }
});
