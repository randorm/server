import { chunk, GraphQLError } from "../deps.ts";
import type { DistributionModel, GroupModel, UserModel } from "../model/mod.ts";
import { DistributionState } from "../model/mod.ts";
import { Gender, Role } from "../model/user.ts";
import { amap, igetMany, map } from "../utils/mod.ts";

export interface Participant {
  readonly user: UserModel;
  readonly subscriberIds: Set<number>;
  readonly subscriptionIds: Set<number>;
}

export function deleteDistributedStudentsFromDict(
  participants: Record<string, Participant>,
  alreadyDistributedIDs: number[],
): Record<string, Participant> {
  for (const distributedStudentID of alreadyDistributedIDs) {
    const distributedStudentKey = String(distributedStudentID);
    delete participants[distributedStudentKey];

    for (const studentID of Object.keys(participants)) {
      const participant = participants[studentID];

      if (participant.subscriptionIds.has(distributedStudentID)) {
        participant.subscriptionIds.delete(distributedStudentID);
      }

      if (participant.subscriberIds.has(distributedStudentID)) {
        participant.subscriberIds.delete(distributedStudentID);
      }
    }
  }

  return participants;
}

export function calculateDemand(
  onePeopleRooms: number[][],
  room: number[],
  participants: Record<string, Participant>,
): [number, number] {
  let bestStudentID = 0;
  let maxDemand = 0;

  for (const roomOne of onePeopleRooms) {
    let demand = 0;
    const studentID: number = roomOne[0];

    for (const hostID of room) {
      const hostIDStr = String(hostID);
      if (
        room.length < 4 && hostIDStr in participants &&
        (participants[hostIDStr].subscriberIds.has(studentID) ||
          participants[hostIDStr].subscriptionIds.has(studentID))
      ) {
        demand += 1;
      }
    }

    if (demand >= maxDemand) {
      maxDemand = demand;
      bestStudentID = studentID;
    }
  }

  return [maxDemand, bestStudentID];
}

export function composeThreePeopleRooms(
  threePeopleRooms: number[][],
  onePeopleRooms: number[][],
  twoPeopleRooms: number[][],
  Participants: Record<string, Participant>,
  finalRooms: number[][],
  rad: boolean,
): number[][] {
  while (
    (onePeopleRooms.length || twoPeopleRooms.length) && threePeopleRooms.length
  ) {
    if (onePeopleRooms.length) {
      finalRooms = findAndExecuteBestCaseForHostRooms(
        threePeopleRooms,
        onePeopleRooms,
        Participants,
        finalRooms,
        1,
      );
    } else if (twoPeopleRooms.length) {
      finalRooms = findAndExecuteBestCaseForHostRooms(
        threePeopleRooms,
        twoPeopleRooms,
        Participants,
        finalRooms,
        1,
      );
    }
  }

  if (threePeopleRooms.length && rad) {
    while (threePeopleRooms.length > 1) {
      if (threePeopleRooms[0].length === 3) {
        threePeopleRooms[0].push(threePeopleRooms[1].shift()!);
      } else if (threePeopleRooms[0].length === 2) {
        threePeopleRooms[0].push(threePeopleRooms[1].shift()!);
        threePeopleRooms[0].push(threePeopleRooms[1].shift()!);
      } else if (threePeopleRooms[0].length === 1) {
        threePeopleRooms[0].push(...threePeopleRooms[1]);
        threePeopleRooms.splice(1, 1);
      }
      finalRooms.push(threePeopleRooms.shift()!);
    }

    if (threePeopleRooms.length) {
      finalRooms.push(threePeopleRooms.shift()!);
    }
  }

  if (rad) {
    if (twoPeopleRooms.length && onePeopleRooms.length) {
      finalRooms.push(twoPeopleRooms[0].concat(onePeopleRooms[0]));
    } else if (twoPeopleRooms.length) {
      finalRooms.push(twoPeopleRooms.shift()!);
    } else if (onePeopleRooms.length) {
      finalRooms.push(onePeopleRooms.shift()!);
    }
  }

  return finalRooms;
}

export function findAndExecuteBestCaseForHostRooms(
  hostPeopleRooms: number[][],
  otherTypeOfRooms: number[][],
  Participants: Record<string, Participant>,
  finalRooms: number[][],
  amountOfPeopleForAdding: number,
): number[][] {
  let bestRoomHostIndex = 0;

  for (
    let _ = 0;
    _ < Math.min(amountOfPeopleForAdding, otherTypeOfRooms.length);
    _++
  ) {
    let maxDemand = 0;
    let bestStudentID = -1;
    let roomHostIndex = 0;
    let bestStudentIndex = 0;
    let bestOtherRoomIndex = 0;
    let tempMaxDemand: number;
    let tempBestStudentID: number;
    for (const room of hostPeopleRooms) {
      if (room.length < 4) {
        for (let j = 0; j < otherTypeOfRooms.length; j++) {
          if (room !== otherTypeOfRooms[j]) {
            for (let i = 0; i < otherTypeOfRooms[j].length; i++) {
              const save = calculateDemand(
                [[otherTypeOfRooms[j][i]]],
                room,
                Participants,
              );
              tempMaxDemand = save[0];
              tempBestStudentID = save[1];

              if (tempMaxDemand >= maxDemand) {
                bestOtherRoomIndex = j;
                bestRoomHostIndex = roomHostIndex;
                maxDemand = tempMaxDemand;
                bestStudentID = tempBestStudentID;
                bestStudentIndex = i;
              }
            }
          }
        }
      }
      roomHostIndex++;
    }

    if (bestStudentID !== -1) {
      hostPeopleRooms[bestRoomHostIndex].push(bestStudentID);
      otherTypeOfRooms[bestOtherRoomIndex].splice(bestStudentIndex, 1);

      if (otherTypeOfRooms[bestOtherRoomIndex].length === 0) {
        otherTypeOfRooms.splice(bestOtherRoomIndex, 1);
      }
    }
  }

  let indexx = -1;
  for (let i = 0; i < hostPeopleRooms.length; i++) {
    if (hostPeopleRooms[i].length === 4) {
      indexx = i;
      break;
    }
  }

  if (indexx === -1) {
    for (let i = 0; i < hostPeopleRooms.length; i++) {
      if (hostPeopleRooms[i].length === 3) {
        indexx = i;
        break;
      }
    }
  }

  if (indexx === -1) {
    for (let i = 0; i < hostPeopleRooms.length; i++) {
      if (hostPeopleRooms[i].length === 2) {
        indexx = i;
        break;
      }
    }
  }

  const room = hostPeopleRooms[indexx];
  finalRooms.push(room);
  hostPeopleRooms.splice(indexx, 1);

  return finalRooms;
}

export function combinations<T>(
  elements: T[],
  combinationLength: number,
): T[][] {
  const results: T[][] = [];

  function backtrack(start: number, combination: T[]) {
    if (combination.length === combinationLength) {
      results.push([...combination]);
      return;
    }

    for (let i = start; i < elements.length; i++) {
      combination.push(elements[i]);
      backtrack(i + 1, combination);
      combination.pop();
    }
  }

  backtrack(0, []);
  return results;
}

export function distributionByAmount(
  data: Record<string, Participant>,
  amount: number,
) {
  const distributedStudents: number[] = [];
  let cnt2 = 0;
  const rooms: number[][] = [];

  for (const id in data) {
    cnt2 += 1;
    if (!distributedStudents.includes(data[id].user.id)) {
      let cnt = 0;
      for (
        const combination of combinations(
          Array.from(data[id].subscriptionIds),
          amount,
        )
      ) {
        cnt += 1;
        cnt2 += 1;
        const newCombination = [...combination, data[id].user.id];
        let flag = true;

        for (const idElement of newCombination) {
          if (distributedStudents.includes(idElement)) {
            flag = false;
          } else {
            for (const element of newCombination) {
              if (element !== idElement) {
                if (
                  element.toString() in data &&
                  !data[element.toString()].subscriptionIds.has(idElement)
                ) {
                  flag = false;
                  break;
                }
              }
            }
          }
        }

        if (flag) {
          for (const o of newCombination) {
            distributedStudents.push(o);
          }
          rooms.push(newCombination);
          break;
        }
      }
    }
  }
  return [distributedStudents, rooms];
}

function remainingDistribution(
  participants: Record<string, Participant>,
): any[] {
  let finalRooms = [];
  let tempRooms = [];
  let participantsOLD: Record<string, Participant> = {};
  for (let R = 3; R >= 0; R--) {
    const info = distributionByAmount(participants, R);
    const alreadyDistributedIDs: number[] | number[][] = info[0];
    const rooms = info[1];
    participants = deleteDistributedStudentsFromDict(
      participants,
      ([] as number[]).concat(...alreadyDistributedIDs),
    );
    if (R === 3) {
      participantsOLD = Object.assign({}, participants);
      for (const room of rooms) {
        finalRooms.push(room);
      }
    } else {
      tempRooms.push(rooms);
    }
  }
  const threePeopleRooms: any[] = tempRooms[0].slice();
  const twoPeopleRooms: any[] = tempRooms[1].slice();
  const onePeopleRooms: any[] = tempRooms[2].slice();
  participants = Object.assign({}, participantsOLD);

  const idsForDeleting: number[] = [];
  for (let roomTwoID = 0; roomTwoID < twoPeopleRooms.length; roomTwoID++) {
    let maxDemand = 0;
    let bestRoomTwoID = -1;
    if (!idsForDeleting.includes(roomTwoID)) {
      for (
        let roomTwoOtherID = 0;
        roomTwoOtherID < twoPeopleRooms.length;
        roomTwoOtherID++
      ) {
        if (
          roomTwoID !== roomTwoOtherID &&
          !idsForDeleting.includes(roomTwoOtherID)
        ) {
          let demand = 0;
          for (const memberID of twoPeopleRooms[roomTwoID]) {
            for (const memberTwoID of twoPeopleRooms[roomTwoOtherID]) {
              if (
                String(memberTwoID) in participants && (
                  participants[String(memberTwoID)].subscriberIds.has(
                    memberID,
                  ) ||
                  participants[String(memberTwoID)].subscriptionIds.has(
                    memberID,
                  )
                )
              ) {
                demand += 1;
              }
            }
          }

          if (maxDemand <= demand) {
            maxDemand = demand;
            bestRoomTwoID = roomTwoOtherID;
          }
        }
      }
    }

    if (bestRoomTwoID !== -1) {
      idsForDeleting.push(bestRoomTwoID);
      idsForDeleting.push(roomTwoID);
      finalRooms.push(
        twoPeopleRooms[roomTwoID].concat(twoPeopleRooms[bestRoomTwoID]),
      );

      participants = deleteDistributedStudentsFromDict(
        participants,
        finalRooms[finalRooms.length - 1].map((x: any) => String(x)),
      );
    }
  }

  let count = 0;
  idsForDeleting.sort();
  for (const ID of idsForDeleting) {
    twoPeopleRooms.splice(ID - count, 1);
    count += 1;
  }

  let ind = 0;
  idsForDeleting.length = 0;
  for (const roomThree of threePeopleRooms) {
    if (onePeopleRooms.length) {
      const [maxDemand, bestStudentID] = calculateDemand(
        onePeopleRooms,
        roomThree,
        participants,
      );
      roomThree.push(bestStudentID);

      onePeopleRooms.shift();
      finalRooms.push(roomThree);
      idsForDeleting.push(ind);
      const alreadyDistributedIDs = roomThree.map((x: any) => String(x));
      participants = deleteDistributedStudentsFromDict(
        participants,
        alreadyDistributedIDs,
      );
    }
    ind += 1;
  }

  idsForDeleting.sort();
  count = 0;
  for (const ID of idsForDeleting) {
    threePeopleRooms.splice(ID - count, 1);
    count += 1;
  }
  idsForDeleting.length = 0;

  finalRooms = composeThreePeopleRooms(
    threePeopleRooms,
    onePeopleRooms,
    twoPeopleRooms,
    participants,
    finalRooms,
    false,
  );

  if (twoPeopleRooms.length) {
    finalRooms = findAndExecuteBestCaseForHostRooms(
      twoPeopleRooms,
      onePeopleRooms,
      participants,
      finalRooms,
      2,
    );
  }

  while (onePeopleRooms.length > 1) {
    const questRoom = findAndExecuteBestCaseForHostRooms(
      onePeopleRooms,
      onePeopleRooms,
      participants,
      finalRooms.slice(),
      3,
    ).pop();
    if (questRoom && questRoom.length === 4) {
      finalRooms.push(questRoom);
    }
    if (questRoom && questRoom.length === 3) {
      threePeopleRooms.push(questRoom);
    } else if (questRoom && questRoom.length === 2) {
      twoPeopleRooms.push(questRoom);
    } else if (questRoom && questRoom.length === 1) {
      onePeopleRooms.unshift(questRoom);
    }
  }

  if (onePeopleRooms.length) {
    if (onePeopleRooms[0].length === 2) {
      twoPeopleRooms.push(onePeopleRooms.shift());
    } else if (onePeopleRooms[0].length === 3) {
      threePeopleRooms.push(onePeopleRooms.shift());
    }
  }

  while (twoPeopleRooms.length > 1) {
    twoPeopleRooms[0].push(twoPeopleRooms[1].shift());
    twoPeopleRooms[0].push(twoPeopleRooms[1].shift());
    twoPeopleRooms.splice(1, 1);
    finalRooms.push(twoPeopleRooms.shift());
  }

  finalRooms = composeThreePeopleRooms(
    threePeopleRooms,
    onePeopleRooms,
    twoPeopleRooms,
    participants,
    finalRooms,
    true,
  );
  return finalRooms;
}

export function fromInputToMap(
  participants: Participant[],
): Record<string, Participant> {
  const ListOfParticipants: Map<string, Participant> = new Map();

  for (const part of participants) {
    ListOfParticipants.set(part.user.id.toString(), part);
  }

  return Object.fromEntries(ListOfParticipants);
}

export function fromDataToOutput(
  distributedParticipants: number[][],
  participants: Record<string, Participant>,
): Participant[][] {
  let roomsCounter = 1;
  let finalArray: Participant[][] = [];
  for (const room of distributedParticipants) {
    const roomParticipants: Participant[] = [];
    for (const roomParticipant of room) {
      const participant = participants[roomParticipant.toString()];
      roomParticipants.push(participant);
    }
    finalArray.push(roomParticipants);
    roomsCounter += 1;
  }
  return finalArray;
}

export function magic(participants: Participant[]): Participant[][] {
  const data1: Record<string, Participant> = fromInputToMap(participants);
  const data2: number[][] = remainingDistribution(data1);
  const data3: Participant[][] = fromDataToOutput(
    data2,
    fromInputToMap(participants),
  );
  return data3;
}

export async function getParticipants(
  participantIds: Set<number>,
  kv: Deno.Kv,
): Promise<Participant[]> {
  return await amap(
    async (user) => {
      const [subscriptionIdsRes, subscriberIdsRes] = await kv.getMany<[
        Set<number>,
        Set<number>,
      ]>([
        ["user:subscription_ids", user.id],
        ["user:subscriber_ids", user.id],
      ]);

      if (subscriptionIdsRes.value === null) {
        throw new GraphQLError(
          `Subscription IDs of User with ID ${user.id} not found`,
        );
      }
      if (subscriberIdsRes.value === null) {
        throw new GraphQLError(
          `Subscriber IDs of User with ID ${user.id} not found`,
        );
      }

      return <Participant> {
        user,
        subscriptionIds: subscriptionIdsRes.value,
        subscriberIds: subscriberIdsRes.value,
      };
    },
    igetMany<UserModel>(
      map((userId) => ["user", userId], participantIds),
      kv,
      ([_part, userId]) => `User with ID ${userId} not found`,
    ),
  );
}

export async function distribute(
  distributionRes: Deno.KvEntry<DistributionModel>,
  kv: Deno.Kv,
): Promise<DistributionModel> {
  const [
    maleParticipantIdsRes,
    femaleParticipantIdsRes,
  ] = await kv.getMany<[
    Set<number>,
    Set<number>,
  ]>([
    ["distribution:male_participant_ids", distributionRes.value.id],
    ["distribution:female_participant_ids", distributionRes.value.id],
  ]);

  if (maleParticipantIdsRes.value === null) {
    throw new GraphQLError(
      `Male participant IDs of Distribution with ID ${distributionRes.value.id} not found`,
    );
  }
  if (femaleParticipantIdsRes.value === null) {
    throw new GraphQLError(
      `Female participant IDs of Distribution with ID ${distributionRes.value.id} not found`,
    );
  }

  const maleParticipants = await getParticipants(
    maleParticipantIdsRes.value,
    kv,
  );
  const femaleParticipants = await getParticipants(
    femaleParticipantIdsRes.value,
    kv,
  );

  const matches = [...magic(maleParticipants), ...magic(femaleParticipants)];

  // TODO(machnevegor): Notify users about their groups

  const groupIds = new Set<number>();
  for (const match of matches) {
    const nextIdRes = await kv.get<Deno.KvU64>(["group_next_id"]);

    if (nextIdRes.value === null) {
      throw new GraphQLError("Next Group ID not found");
    }

    const group: GroupModel = {
      id: Number(nextIdRes.value),
      distributionId: distributionRes.value.id,
      memberIds: new Set<number>(
        map((participant) => participant.user.id, match),
      ),
      createdAt: new Date(),
    };

    const groupCommitRes = await kv.atomic()
      .check(nextIdRes)
      .set(["group", group.id], group)
      .sum(["group_count"], 1n)
      .sum(["group_next_id"], 1n)
      .commit();

    if (!groupCommitRes.ok) {
      throw new GraphQLError("Failed to create Group");
    }

    for (const participant of match) {
      const participantGroupIdsRes = await kv.get<Set<number>>(
        ["user:group_ids", participant.user.id],
      );

      if (participantGroupIdsRes.value === null) {
        throw new GraphQLError(
          `Group IDs of User with ID ${participant.user.id} not found`,
        );
      }

      const groupIds = new Set<number>([
        ...participantGroupIdsRes.value,
        group.id,
      ]);

      const participantCommitRes = await kv.atomic()
        .check(participantGroupIdsRes)
        .set(["user:group_ids", participant.user.id], groupIds)
        .sum(["user:group_count", participant.user.id], 1n)
        .commit();

      if (!participantCommitRes.ok) {
        throw new GraphQLError(
          `Failed to add Group with ID ${group.id} to User with ID ${participant.user.id}`,
        );
      }
    }

    groupIds.add(group.id);
  }

  const update: DistributionModel = {
    ...distributionRes.value,
    state: DistributionState.CLOSED,
    updatedAt: new Date(),
  };

  const distributionCommitRes = await kv.atomic()
    .check(distributionRes)
    .set(["distribution", distributionRes.value.id], update)
    .set(
      ["distribution:group_count", distributionRes.value.id],
      new Deno.KvU64(BigInt(groupIds.size)),
    )
    .set(["distribution:group_ids", distributionRes.value.id], groupIds)
    .commit();

  if (!distributionCommitRes.ok) {
    throw new GraphQLError(
      `Failed to close Distribution with ID ${distributionRes.value.id}`,
    );
  }

  return update;
}
