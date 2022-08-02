import asyncio
from enum import Enum
from json import dumps
from os import getenv

import aioredis
from aiogram import Bot
from aiogram.types import InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from pydantic import BaseModel, ValidationError


class Node(BaseModel):
    username: str
    subscriptions: list[str]


class Gender(str, Enum):
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
    for key in await redis.keys("fsm:*:data"):
        data = await redis.get(key)

        try:
            student = Student.parse_raw(data)
        except ValidationError:
            continue

        chat_id, user_id = key.split(":")[1:-1]

        try:
            await bot.send_message(
                chat_id,
                f"{student.name}, the second phase has "
                "come to an end. We're glad you took part!",
                reply_markup=InlineKeyboardBuilder().row(
                    InlineKeyboardButton(
                        text="Support",
                        url="tg://user?id=709491996"
                    )
                ).as_markup()
            )
        finally:
            students |= {user_id: student.dict()}

    with open("students.json", "w") as file:
        file.write(dumps(students))


if __name__ == "__main__":
    asyncio.run(main(getenv("TOKEN"), getenv("REDIS")))
