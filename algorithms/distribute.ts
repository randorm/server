import { chunk, GraphQLError } from "../deps.ts";
import type { DistributionModel, GroupModel, UserModel } from "../model/mod.ts";
import { DistributionState } from "../model/mod.ts";
import { amap, igetMany, map } from "../utils/mod.ts";

export interface Participant {
  readonly user: UserModel;
  readonly subscriberIds: Set<number>;
  readonly subscriptionIds: Set<number>;
}

export function magic(participants: Participant[]): Participant[][] {
  // TODO(Azaki-san): Implement this.
  return chunk(participants, 4);
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

  // TODO(Azaki-san): Note this.
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
