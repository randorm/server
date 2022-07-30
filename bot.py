from os import getenv
from re import search

from aiogram import Dispatcher, Bot, F
from aiogram.dispatcher.fsm.context import FSMContext
from aiogram.dispatcher.fsm.state import StatesGroup, State
from aiogram.dispatcher.fsm.storage.redis import RedisStorage
from aiogram.types import Message, InlineKeyboardButton, CallbackQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder

dp = Dispatcher(storage=RedisStorage.from_url(getenv("REDIS")))


class Form(StatesGroup):
    name = State()
    gender = State()
    age = State()
    confirm = State()
    subscribe = State()


@dp.callback_query(F.data.startswith("@"))
async def _(query: CallbackQuery, state: FSMContext):
    context = await state.get_data()
    if query.data in context["subscriptions"]:
        context["subscriptions"].remove(query.data)
        await state.set_data(context)

        subscribe = InlineKeyboardBuilder().row(
            InlineKeyboardButton(text="Subscribe again",
                                 callback_data=query.data)
        ).as_markup()

        await query.message.edit_text(
            f"You've unsubscribed from {query.data}.",
            reply_markup=subscribe
        )
    else:
        context["subscriptions"].append(query.data)
        await state.set_data(context)

        unsubscribe = InlineKeyboardBuilder().row(
            InlineKeyboardButton(text="Unsubscribe",
                                 callback_data=query.data)
        ).as_markup()

        await query.message.edit_text(
            f"You've subscribed to {query.data} again.",
            reply_markup=unsubscribe
        )


@dp.message(Form.subscribe)
async def _(message: Message, state: FSMContext):
    match = search(r"@[\w\d_]{5,32}", message.text)
    if match:
        author = match.group()
        if author == "@" + message.from_user.username:
            await message.reply("You forwarded your own resume 👀")
        else:
            context = await state.get_data()

            if author in context["subscriptions"]:
                await message.reply("You've already forward this resume 👀")
            else:
                context["subscriptions"].append(author)
                await state.set_data(context)

                unsubscribe = InlineKeyboardBuilder().row(
                    InlineKeyboardButton(text="Unsubscribe",
                                         callback_data=author)
                ).as_markup()

                await message.answer(f"You've subscribed to {author}. "
                                     "Forward more resumes to increase "
                                     "chances of finding the best room.",
                                     reply_markup=unsubscribe)
    else:
        await message.reply("It doesn't look like resume 👀")


RESUMES = InlineKeyboardBuilder().row(
    InlineKeyboardButton(text="Jump to resumes", url=getenv("RESUMES"))
).as_markup()


@dp.callback_query(Form.confirm)
async def _(query: CallbackQuery, state: FSMContext):
    match query.data:
        case "yes":
            await state.update_data({
                "username": "@" + query.from_user.username,
                "subscriptions": []
            })

            await state.set_state(Form.subscribe)
            await query.message.edit_text("Great! Now look for interesting "
                                          "resumes and forward them here.",
                                          reply_markup=RESUMES)
        case "no":
            await state.set_state(Form.name)
            await query.message.edit_text("What is your name?")


CONFIRM = InlineKeyboardBuilder().row(
    InlineKeyboardButton(text="👍", callback_data="yes"),
    InlineKeyboardButton(text="👎", callback_data="no")
).as_markup()


@dp.message(Form.age)
async def _(message: Message, state: FSMContext):
    if message.text.isdigit():
        await state.update_data({"age": int(message.text)})

        await state.set_state(Form.confirm)
        context = await state.get_data()
        await message.answer(f"So, your name is {context['name']}, "
                             f"you're {context['gender']} and "
                             f"you're {context['age']}, right?",
                             reply_markup=CONFIRM)
    else:
        await message.reply("It doesn't look like age 👀")


@dp.callback_query(Form.gender)
async def _(query: CallbackQuery, state: FSMContext):
    await state.update_data({"gender": query.data})

    await state.set_state(Form.age)
    await query.message.edit_text("How old are you?")


GENDER = InlineKeyboardBuilder().row(
    InlineKeyboardButton(text="👦", callback_data="male"),
    InlineKeyboardButton(text="👧", callback_data="female")
).as_markup()


@dp.message(Form.name)
async def _(message: Message, state: FSMContext):
    await state.update_data({"name": message.text})

    await state.set_state(Form.gender)
    await message.answer("Choose your gender", reply_markup=GENDER)


@dp.message(commands="start")
async def _(message: Message, state: FSMContext):
    await state.set_state(Form.name)
    await message.answer("What is your name?")


if __name__ == "__main__":
    dp.run_polling(Bot(getenv("TOKEN")))
