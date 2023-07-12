import { session } from "../../deps.ts";
import { MyContext, SessionData, RegistrationStep, EditingStep } from "./types.ts";
import { isValidDate } from "./plugins/validDateTempFunc.ts";
import { bot, state } from "../../mod.ts";
import { createUser, updateUserProfile } from "../database/operation/user.ts";
import { genderValidation } from "./plugins/genderValidation.ts";
import { DateTimeScalar } from "../../services/graphql/scalar/datetime.ts";
import { ProfileModel } from "../../services/database/model/user.ts";

// const bot = new Bot<MyContext>(
//   "1786952895:AAHY7ZdGvly2ygQT3EQIFztPyen4c-EcwiY",
// );

// Also need to import 
// bot.use(limit({
//   timeFrame: 1000,
//   limit: 2,
//   onLimitExceeded: async (ctx) => {
//     await ctx.reply("🚨 Wow, slow down! 🚨");
//   },
// }));

bot.use(session<SessionData, MyContext>({ initial: () => ({}) }));

bot.command("start", async (ctx: MyContext) => {
  if (ctx.session.registrationStep !== RegistrationStep.Next) {
    const newMessage = await ctx.reply("*Welcome to the _Randorm_\\ \\- the place where you will find your best roommates\\.\nLet's register you in the bot \\=\\)*", { parse_mode: "MarkdownV2" });
    ctx.session.lastBotMessageId = newMessage.message_id;
    await askName(ctx);
  } else {
    const newMessage = await ctx.reply("You are already registered. Use /profile :)");
    ctx.session.lastBotMessageId = newMessage.message_id;
  }
});

bot.command("profile", async (ctx: MyContext) => {
  const userData = getUserData(ctx);
  const keyboard = [
    [{ text: "Edit Info", callback_data: "edit" }]
  ];

  const newMessage = await ctx.reply(`Your profile data:\n${userData}`, {
    reply_markup: {
      inline_keyboard: keyboard
    }
  });

  ctx.session.lastBotMessageId = newMessage.message_id;
});

async function askName(ctx: MyContext) {
  const newMessage = await ctx.reply('Enter your name and surname like _Name Surname_', { reply_markup: {
    inline_keyboard: [
      [{ text: "Cancel", callback_data: "cancel" }],
    ],
  },
   parse_mode: "MarkdownV2" });
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.Name;
}

async function askGender(ctx: MyContext) {
  const newMessage = await ctx.reply("Please, select your gender.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Male", callback_data: "male" }],
        [{ text: "Female", callback_data: "female" }],
        [{ text: "Back", callback_data: "back" }],
        [{text: "Cancel", callback_data: "cancel"}],
      ],
    },
  });
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.Gender;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
}

async function askBirthday(ctx: MyContext) {
  const newMessage = await ctx.reply("Enter your date of birthday (YYYY-MM-DD).", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Back", callback_data: "back" }],
        [{ text: "Cancel", callback_data: "cancel" }],
      ],
    },
  });
  ctx.session.lastBotMessageId = newMessage.message_id;
  ctx.session.registrationStep = RegistrationStep.Birthday;
  ctx.session.previousStep = ctx.session.registrationStep - 1;
}

async function askBio(ctx: MyContext) {
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

function getUserData(ctx: MyContext): string {
  const s = `Name: ${ctx.session.userData?.name}
Surname: ${ctx.session.userData?.surname}
Gender: ${ctx.session.userData?.gender}
Date of birthday: ${ctx.session.userData?.birthday}
Bio: ${ctx.session.userData?.bio}\n
`;
  return s;
}

async function editingConfirmation(ctx: MyContext, ) {
  const keyboard = [
    [{ text: "Edit Info", callback_data: "edit" }]];
  const userData = getUserData(ctx);
  if (ctx.session.lastBotMessageId && ctx.chat?.id) {
  await bot.api.deleteMessage(ctx.chat.id, ctx.session.lastBotMessageId);
  ctx.session.editingStep = EditingStep.Done;
  const newMessage = await ctx.reply(`Your profile data:\n${userData}`, {
  reply_markup: {
    inline_keyboard: keyboard
    }
    });
  ctx.session.lastBotMessageId = newMessage.message_id;
  }
}

async function editingBack(ctx: MyContext, ) {
  if (ctx.session.lastBotMessageId && ctx.chat?.id) {
  await bot.api.deleteMessage(ctx.chat.id, ctx.session.lastBotMessageId);
  }
  const message = await ctx.reply("What information do you want to edit?", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Name", callback_data: "edit_name" }],
        [{ text: "Gender", callback_data: "edit_gender" }],
        [{ text: "Date of Birthday", callback_data: "edit_birthday" }],
        [{ text: "Bio", callback_data: "edit_bio" }],
        [{ text: "Back", callback_data: "cancel_back" }]
      ]
    }
  });
  ctx.session.editingStep = EditingStep.Done;
  ctx.session.registrationStep = RegistrationStep.Next;
  ctx.session.lastBotMessageId = message.message_id;
}

bot.on('message', async (ctx: MyContext) => {
  const step = ctx.session?.registrationStep;
  if (step == RegistrationStep.Editing)
  {
    {
    const step2 = ctx.session.editingStep;
    if (step2 == EditingStep.NameEdition && ctx.session.lastBotMessageId) {
      const nameSurname = ctx.message?.text?.split(" ");
      if (nameSurname?.length == 2 && ctx.session.userData) {
        ctx.session.userData.name = nameSurname[0];
        ctx.session.userData.surname = nameSurname[1]; 
        editingConfirmation(ctx);
        const newMessage = await ctx.reply("Successfully edited!");
        ctx.session.lastBotMessageId = newMessage.message_id;
        ctx.session.editingStep = EditingStep.Done;
        ctx.session.registrationStep = RegistrationStep.Next;
      } else {
        ctx.reply("Incorrect format. Try again (Name Surname)");
      }
    }
    else if (step2 == EditingStep.BirthdayEdition)
    {
    const birthday = ctx.message?.text ? ctx.message?.text : "";
    if (isValidDate(birthday) && ctx.session.userData) {
      ctx.session.userData.birthday = birthday;
      editingConfirmation(ctx);
      const newMessage = await ctx.reply("Successfully edited!");
      ctx.session.lastBotMessageId = newMessage.message_id;
      ctx.session.editingStep = EditingStep.Done;
      ctx.session.registrationStep = RegistrationStep.Next;
    } else {
      const newMessage = await ctx.reply("Incorrect format. Try again (DD.MM.YYYY)");
      ctx.session.lastBotMessageId = newMessage.message_id;
    }
    }
    else if (step2 == EditingStep.BioEdition && ctx.session.userData)
    {
      ctx.session.userData.bio = ctx.message?.text;
      editingConfirmation(ctx);
      const newMessage = await ctx.reply("Successfully edited!");
      ctx.session.lastBotMessageId = newMessage.message_id;
      ctx.session.editingStep = EditingStep.Done;
      ctx.session.registrationStep = RegistrationStep.Next;
    }
    if ( ctx.session.editingStep === EditingStep.Done) {
      // TODO: Update user profile. Ask. Problems.
    //   const model: ProfileModel = {firstName: ctx.session.userData.name, lastName: ctx.session.userData.surname,
    //     gender: genderValidation(ctx.session.userData.gender), birthday: DateTimeScalar.parseValue(ctx.session.userData.birthday + " 00:00:00"),
    //    bio: ctx.session.userData.bio};
    //   updateUserProfile()
    }
  }
}
  else{
  if (step == RegistrationStep.Name) {
    const nameSurname = ctx.message?.text?.split(" ");
    if (nameSurname?.length == 2) {
      ctx.session.userData = { name: nameSurname[0], surname: nameSurname[1] };
      await askGender(ctx);
    } else {
      ctx.reply("Incorrect format. Try again (Name Surname)",  { reply_markup: {
        inline_keyboard: [
          [{ text: "Cancel", callback_data: "cancel" }],
        ],
      }});
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
      const newMessage = await ctx.reply("Incorrect format. Try again (YYYY-MM-DD)", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Back", callback_data: "back" }],
            [{ text: "Cancel", callback_data: "cancel" }],
          ],
        },
      });
      ctx.session.lastBotMessageId = newMessage.message_id;
    }
  } else if (step == RegistrationStep.Bio && ctx.session.userData) {
    ctx.session.userData.bio = ctx.message?.text;
    await ctx.reply("Next questions from distributions bluh bluh bluh");
    ctx.session.registrationStep = RegistrationStep.Next;
    ctx.session.previousStep = RegistrationStep.Bio;
    const s = getUserData(ctx);
    const newMessage = await ctx.reply(`Your information profile:\n${s}Confirm?`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Confirm", callback_data: "confirm" }],
          [{ text: "Back", callback_data: "back" }],
          [{ text: "Cancel", callback_data: "cancel" }],
        ],
      },
    });
    ctx.session.lastBotMessageId = newMessage.message_id;
  }
}})
;



bot.on("callback_query:data", async (ctx: MyContext) => {
  const data = ctx.callbackQuery?.data;
  const step = ctx.session?.registrationStep;
  const step2 = ctx.session?.editingStep;
  if (data == "back" && ctx.session.registrationStep != undefined && ctx.session.previousStep != undefined) {
      ctx.session.registrationStep -= 1;
      ctx.session.previousStep -= 1;
      if (ctx.chat?.id && ctx.session.lastBotMessageId) {
        if (ctx.session.registrationStep === RegistrationStep.Name) {
          await bot.api.editMessageText(ctx.chat.id, ctx.session.lastBotMessageId, 'Enter your name and surname like _Name Surname_', { parse_mode: "MarkdownV2" });
          await bot.api.editMessageReplyMarkup(ctx.chat.id, ctx.session.lastBotMessageId, { reply_markup: {
            inline_keyboard: [
              [{ text: "Cancel", callback_data: "cancel" }],
            ],
          }
          });
        } else if (ctx.session.registrationStep === RegistrationStep.Gender) {
          await bot.api.editMessageText(ctx.chat.id, ctx.session.lastBotMessageId, "Please, select your gender.");
          await bot.api.editMessageReplyMarkup(ctx.chat.id, ctx.session.lastBotMessageId, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Male", callback_data: "male" }],
                [{ text: "Female", callback_data: "female" }],
                [{ text: "Back", callback_data: "back" }],
                [{text: "Cancel", callback_data: "cancel"}],
              ],
            },
          })
        } else if (ctx.session.registrationStep === RegistrationStep.Birthday) {
          await bot.api.editMessageText(ctx.chat.id, ctx.session.lastBotMessageId, "Enter your date of birthday (DD.MM.YYYY).");
          await bot.api.editMessageReplyMarkup(ctx.chat.id, ctx.session.lastBotMessageId, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Back", callback_data: "back" }],
                [{ text: "Cancel", callback_data: "cancel" }],
              ],
            },
          })
        } else if (ctx.session.registrationStep === RegistrationStep.Bio) {
          await bot.api.editMessageText(ctx.chat.id, ctx.session.lastBotMessageId, "Enter your bio (a few sentences).");
          await bot.api.editMessageReplyMarkup(ctx.chat.id, ctx.session.lastBotMessageId, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Back", callback_data: "back" }],
                [{ text: "Cancel", callback_data: "cancel" }],
              ],
            },
          });
        }
    }
  } else if (data == "cancel") {
    const newMessage = await ctx.reply("Registration was cancelled. Click /start if you remind.");
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.registrationStep = undefined;
    ctx.session.userData = undefined;
  } else if (data && step == RegistrationStep.Gender && ctx.session.userData) {
    ctx.session.userData.gender = data;
    await askBirthday(ctx);
  } 
  else if (data && step2 == EditingStep.GenderEdition && ctx.session.userData && (data === "male" || data === "female")) {
    ctx.session.userData.gender = data;
    editingConfirmation(ctx);
    ctx.session.editingStep = EditingStep.Done;
    ctx.session.registrationStep = RegistrationStep.Next;
  } else if (data == "confirm" && ctx.session.userData && ctx.session.userData.gender && ctx.session.userData.name &&
   ctx.session.userData.surname && ctx.session.userData.bio && ctx.chat?.id && ctx.session.lastBotMessageId) {
    await bot.api.editMessageText(ctx.chat.id, ctx.session.lastBotMessageId, "Confirmed! Now you are registered. Soon will add the ability to edit your data? Now use /profile.");
    ctx.session.registrationStep = RegistrationStep.Next;
    ctx.session.previousStep = undefined;
    const model: ProfileModel = {firstName: ctx.session.userData.name, lastName: ctx.session.userData.surname,
      gender: genderValidation(ctx.session.userData.gender), birthday: DateTimeScalar.parseValue(ctx.session.userData.birthday + " 00:00:00"),
     bio: ctx.session.userData.bio};
    //  THERE ARE CTX.CHAT.USERNAME!!!
    createUser(state,
       { telegramId: ctx.chat.id, username: username, profile: model });
  }
  else if (data === "edit") {
    await ctx.answerCallbackQuery({ text: "Editing profile..." });

    const message = await ctx.reply("What information do you want to edit?", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Name", callback_data: "edit_name" }],
          [{ text: "Gender", callback_data: "edit_gender" }],
          [{ text: "Date of Birthday", callback_data: "edit_birthday" }],
          [{ text: "Bio", callback_data: "edit_bio" }],
          [{ text: "Back", callback_data: "cancel_back" }]
        ]
      }
    });

    ctx.session.lastBotMessageId = message.message_id;
  }
  else if (data === "edit_name" && ctx.session.lastBotMessageId && ctx.chat?.id) {
    await bot.api.deleteMessage(ctx.chat.id, ctx.session.lastBotMessageId);
    const newMessage = await ctx.reply("Enter your new name:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "edit_back" }],
          [{text: "Cancel", callback_data: "cancel_back"}]
        ]
      }
    });
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.registrationStep = RegistrationStep.Editing;
    ctx.session.editingStep = EditingStep.NameEdition;
    console.log(ctx.session.editingStep);
  } else if (data === "edit_gender" && ctx.session.lastBotMessageId && ctx.chat?.id) {
    await bot.api.deleteMessage(ctx.chat.id, ctx.session.lastBotMessageId);
    const newMessage = await ctx.reply("Select your new gender:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Male", callback_data: "male" }],
          [{ text: "Female", callback_data: "female" }],
          [{ text: "Back", callback_data: "edit_back" }],
          [{text: "Cancel", callback_data: "cancel_back"}],
        ],
      },
    })
    ctx.session.lastBotMessageId = newMessage.message_id;
    ctx.session.editingStep = EditingStep.GenderEdition;
    ctx.session.registrationStep = RegistrationStep.Editing;
  } else if (data === "edit_birthday" && ctx.session.lastBotMessageId && ctx.chat?.id) {
    await bot.api.deleteMessage(ctx.chat.id, ctx.session.lastBotMessageId);
    const newMessage = await ctx.reply("Enter your new date of birthday (YYYY-MM-DD):", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "edit_back" }],
          [{text: "Cancel", callback_data: "cancel_back"}]
        ]
      }
    });
    ctx.session.editingStep = EditingStep.BirthdayEdition;
    ctx.session.registrationStep = RegistrationStep.Editing;
    ctx.session.lastBotMessageId = newMessage.message_id;
  } else if (data === "edit_bio" && ctx.session.lastBotMessageId && ctx.chat?.id) {
    await bot.api.deleteMessage(ctx.chat.id, ctx.session.lastBotMessageId);
    const newMessage = await ctx.reply("Enter your new bio:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "edit_back" }],
          [{text: "Cancel", callback_data: "cancel_back"}]
        ]
      }
    });
    ctx.session.registrationStep = RegistrationStep.Editing;
    ctx.session.editingStep = EditingStep.BioEdition;
    ctx.session.lastBotMessageId = newMessage.message_id;
  }
  else if (data === "edit_back" && ctx.session.lastBotMessageId) {
    editingBack(ctx);
    ctx.session.registrationStep = RegistrationStep.Next;
    ctx.session.editingStep = EditingStep.Done;
  }
  else if (data === "cancel_back" && ctx.session.lastBotMessageId) {
    editingConfirmation(ctx);
    ctx.session.registrationStep = RegistrationStep.Next;
    ctx.session.editingStep = EditingStep.Done;
  }
})

bot.start();