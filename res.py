import asyncio
import logging
from asyncio import sleep
from enum import Enum
from json import dumps
from os import getenv

import aioredis
from aiogram import Bot
from aiogram.exceptions import TelegramForbiddenError
from aiogram.types import InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from pydantic import BaseModel, ValidationError

COOLDOWN = 3


class Node(BaseModel):
    username: str
    subscriptions: list[str]


class Gender(Enum):
    MALE = "male"
    FEMALE = "female"


class Student(Node):
    name: str
    gender: Gender
    age: int


async def main(token: str, redis_url: str):
    bot = Bot(token)
    redis = aioredis.from_url(redis_url, decode_responses=True)

    students = {}
    for state_key in await redis.keys("fsm:*:state"):
        state = await redis.get(state_key)
        if state == "Form:subscribe":
            data_key = state_key.replace("state", "data")
            data = await redis.get(data_key)

            try:
                student = Student.parse_raw(data)
            except ValidationError as error:
                logging.warning(error)
                continue

            chat, user = map(int, state_key.split(":")[1:-1])
            try:
                await bot.send_message(
                    chat,
                    f"{student.name}, the second phase has "
                    "come to an end. We're glad you took part!",
                    reply_markup=InlineKeyboardBuilder().row(
                        InlineKeyboardButton(text="Support",
                                             url="tg://user?id=709491996")
                    ).as_markup()
                )
            except TelegramForbiddenError as error:
                logging.warning(error)
                continue
            else:
                students |= {user: student}
            finally:
                await sleep(COOLDOWN)

    with open("students.json", "w") as file:
        file.write(dumps(students))


if __name__ == "__main__":
    asyncio.run(main(getenv("TOKEN"), getenv("REDIS")))
