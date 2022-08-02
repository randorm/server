import asyncio
from asyncio import sleep
from enum import Enum
from json import dumps
from os import getenv

import aioredis
from aiogram import Bot
from aiogram.types import InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from pydantic import BaseModel

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


SUPPORT = InlineKeyboardBuilder().row(
    InlineKeyboardButton(text="Support", url=getenv("SUPPORT"))
).as_markup()


async def main(token: str, url: str):
    bot = Bot(token)
    redis = aioredis.from_url(url, decode_responses=True)

    students = {}
    for state_key in await redis.keys("fsm:*:state"):
        chat, user = map(int, state_key.split(":")[1:-1])
        if await redis.get(state_key) == "Form:subscribe":
            data_key = state_key.replace("state", "data")

            data = await redis.get(data_key)
            student = Student.parse_raw(data)

            try:
                await bot.send_message(
                    chat,
                    f"{student.name}, the second phase has come "
                    "to an end. We're glad you took part!",
                    reply_markup=SUPPORT
                )
                await sleep(COOLDOWN)
            finally:
                students |= {user: student.dict()}

    with open("students.json", "w") as file:
        file.write(dumps(students))


if __name__ == "__main__":
    asyncio.run(main(getenv("TOKEN"), getenv("REDIS")))
