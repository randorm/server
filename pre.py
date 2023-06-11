from collections import deque
from enum import Enum

from pydantic import BaseModel, parse_raw_as

CAPACITY = 5


class Node(BaseModel):
    id: int
    relations: list[int]


class Gender(Enum):
    MALE = "male"
    FEMALE = "female"


class Student(Node):
    name: str
    gender: Gender
    age: int


with open("students.json") as file:
    students = parse_raw_as(list[Student], file.read())
    graph = {student.id: student for student in students}

rooms = []
groups = deque()
singles = []

invited = []
for owner in filter(
        lambda student: student not in invited,
        students
):
    group = [owner]
    for student in map(
            lambda relation: graph[relation],
            owner.relations
    ):
        if student not in invited and \
                owner.id in student.relations:
            group.append(student)

    if len(group) == 2:
        creator, roommate = group
        if len(creator.relations) == len(roommate.relations) == 1:
            if creator.gender == roommate.gender or \
                    creator.age >= 18 and roommate.age >= 18:
                rooms.append(group)
            else:
                singles += group
        else:
            singles.append(creator)
            if len(roommate.relations) == 1:
                singles.append(roommate)
            else:
                group.pop()
    else:
        for member in group[1:]:
            if member.gender != owner.gender:
                group.remove(member)

        if len(group) == 1:
            singles.append(owner)
        else:
            groups.append(group)

    invited += group

while groups:
    room = groups.popleft()

    if len(room) < CAPACITY:
        demand = {}
        for member in room:
            for candidate in filter(
                    lambda r: graph[r] in singles,
                    member.relations
            ):
                if candidate in demand:
                    demand[candidate] += 1
                else:
                    demand[candidate] = 1

        selection = sorted(
            map(lambda k: graph[k], demand.keys()),
            key=lambda student: demand[student.id]
        )

        while selection and len(room) < CAPACITY:
            student = selection.pop()
            if student.gender == room[0].gender:
                singles.remove(student)
                room.append(student)

    rooms.append(room)

print(*map(len, rooms))
print(*map(lambda s: s.name, singles), sep="\n")
