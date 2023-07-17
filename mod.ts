import { GraphQLError } from "./deps.ts";
import { distribute } from "./services/algorithms/mod.ts";
import {
  assertChoiceField,
  assertDistribution,
  assertTextField,
} from "./services/database/assert/mod.ts";
import type {
  ChoiceFieldModel,
  DistributionModel,
  FieldModel,
  TextFieldModel,
  UserModel,
} from "./services/database/model/mod.ts";
import {
  DistributionState,
  FieldType,
  Role,
} from "./services/database/model/mod.ts";
import { difference, getMany, map } from "./utils/mod.ts";

const USER_ID = 1;

const FIELDS = [
  // 1
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Lark or owl?\n\nA. Lark\nB. Owl",
    multiple: false,
    options: [
      "A",
      "B",
    ],
  },
  // 2
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question:
      "Order is important to you?\n\nA. Order is a saint thing\nB. Order isn't the most important thing in life\nC. I can adapt to any conditions",
    multiple: false,
    options: [
      "A",
      "B",
      "C",
    ],
  },
  // 3
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question:
      "Comfortable temperature\n\nA. I like it cool, air it out a lot\nB. I like the warmth and fresh air\nC. The warmer the better",
    multiple: false,
    options: [
      "A",
      "B",
      "C",
    ],
  },
  // 4
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question:
      "How do you feel about noise?\n\nA. Good, I like to listen to loud music and talk loudly\nB. Neutral, I can live in any conditions\nC. I don't like noise, I try to be in quiet most of the time",
    multiple: false,
    options: [
      "A",
      "B",
      "C",
    ],
  },
  // 5
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question:
      "Nutritional habits\n\nA. I cook by myself\nB. I'll be ordering take-outs\nC. I'll go to the canteen",
    multiple: false,
    options: [
      "A",
      "B",
      "C",
    ],
  },
  // 6
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question:
      "How do you feel about sharing things and food?\n\nA. Negative, I will only cook for myself\nB. Positive, ready to buy food and cook together\nC. Doesn't matter, negotiable",
    multiple: false,
    options: [
      "A",
      "B",
      "C",
    ],
  },
  // 7
  <Omit<TextFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.TEXT,
    required: true,
    question: "Do you have any allergies?",
    format: null,
    sample: null,
  },
  // 8
  <Omit<TextFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.TEXT,
    required: true,
    question: "Describe your interests, hobbies and habits",
    format: null,
    sample: null,
  },
  // 9
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Do you smoke?\n\nA. Yes\nB. Rarely\nC. No",
    multiple: false,
    options: [
      "A",
      "B",
      "C",
    ],
  },
  // 10
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Do you drink alcohol?\n\nA. Yes\nB. Rarely\nC. No",
    multiple: false,
    options: [
      "A",
      "B",
      "C",
    ],
  },
  // 11
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Native language\n\nA. Russian\nB. English\nC. Other",
    multiple: false,
    options: [
      "A",
      "B",
      "C",
    ],
  },
  // 12
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question:
      "Sociability\n\nA. Talking all the time\nB. Depends on the mood\nC. Talking is not for me",
    multiple: false,
    options: [
      "A",
      "B",
      "C",
    ],
  },
  // 13
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question:
      "Most of the time I'd like to spend...\n\nA. In privacy, I value personal space where no one is disturbing me\nB. With friends, I like to be in the company\nC. Depends on mood, I like to be alone and in company",
    multiple: false,
    options: [
      "A",
      "B",
      "C",
    ],
  },
  // 14
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question:
      "I'd like a roommate...\n\nA. Who speaks russian\nB. A foreigner speaker",
    multiple: false,
    options: [
      "A",
      "B",
    ],
  },
  // 15
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question:
      "I'd like a roommate...\n\nA. Similar to my preferences\nB. Opposite to my preferences",
    multiple: false,
    options: [
      "A",
      "B",
    ],
  },
];

const kv = await Deno.openKv();

async function createDistribution(
  { name }: { name: string },
): Promise<DistributionModel> {
  const nextIdRes = await kv.get<Deno.KvU64>(["distribution_next_id"]);

  if (nextIdRes.value === null) {
    throw new GraphQLError("Next Distribution ID not found");
  }

  const distribution: DistributionModel = {
    id: Number(nextIdRes.value),
    state: DistributionState.PREPARING,
    creatorId: USER_ID,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  assertDistribution(distribution);

  const commitRes = await kv.atomic()
    .check(nextIdRes)
    .set(["distribution", distribution.id], distribution)
    .set(
      ["distribution:field_count", distribution.id],
      new Deno.KvU64(0n),
    )
    .set(["distribution:field_ids", distribution.id], new Set<number>())
    .sum(["distribution_count"], 1n)
    .sum(["distribution_next_id"], 1n)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError("Failed to create Distribution");
  }

  return distribution;
}

async function createTextField(
  args: Pick<TextFieldModel, "required" | "question" | "format" | "sample">,
): Promise<TextFieldModel> {
  const nextRes = await kv.get<Deno.KvU64>(["field_next_id"]);

  if (nextRes.value === null) {
    throw new GraphQLError("Next Field ID not found");
  }

  const field: TextFieldModel = {
    id: Number(nextRes.value),
    type: FieldType.TEXT,
    creatorId: USER_ID,
    ...args,
    createdAt: new Date(),
  };

  assertTextField(field);

  const commitRes = await kv.atomic()
    .set(["field", field.id], field)
    .set(["field:answer_count", field.id], new Deno.KvU64(0n))
    .sum(["field_count"], 1n)
    .sum(["field_next_id"], 1n)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError("Failed to create TextField");
  }

  return field;
}

async function createChoiceField(
  args: Pick<
    ChoiceFieldModel,
    "required" | "question" | "multiple" | "options"
  >,
): Promise<ChoiceFieldModel> {
  const nextRes = await kv.get<Deno.KvU64>(["field_next_id"]);

  if (nextRes.value === null) {
    throw new GraphQLError("Next Field ID not found");
  }

  const field: ChoiceFieldModel = {
    id: Number(nextRes.value),
    type: FieldType.CHOICE,
    creatorId: USER_ID,
    ...args,
    createdAt: new Date(),
  };

  assertChoiceField(field);

  const commitRes = await kv.atomic()
    .set(["field", field.id], field)
    .set(["field:answer_count", field.id], new Deno.KvU64(0n))
    .sum(["field_count"], 1n)
    .sum(["field_next_id"], 1n)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError("Failed to create ChoiceField");
  }

  return field;
}

async function updateDistributionFields(
  { distributionId, fieldIds }: {
    distributionId: number;
    fieldIds: readonly number[];
  },
): Promise<DistributionModel> {
  const [
    distributionRes,
    fieldIdsRes,
  ] = await kv.getMany<[DistributionModel, Set<number>]>([
    ["distribution", distributionId],
    ["distribution:field_ids", distributionId],
  ]);

  if (distributionRes.value === null) {
    throw new GraphQLError(
      `Distribution with ID ${distributionId} not found`,
    );
  }
  if (fieldIdsRes.value === null) {
    throw new GraphQLError(
      `Field IDs of Distribution with ID ${distributionId} not found`,
    );
  }

  if (distributionRes.value.state !== DistributionState.PREPARING) {
    throw new GraphQLError(
      `Distribution with ID ${distributionId} is not in PREPARING state`,
    );
  }

  const uniqueFieldIds = new Set(fieldIds);

  if (uniqueFieldIds.size !== fieldIds.length) {
    throw new GraphQLError("Field IDs must be unique");
  }

  const unverifiedFieldIds = difference(
    uniqueFieldIds,
    fieldIdsRes.value,
  );

  await getMany<FieldModel>(
    map((fieldId) => ["field", fieldId], unverifiedFieldIds),
    kv,
    ([_part, fieldId]) => `Field with ID ${fieldId} not found`,
  );

  const commitRes = await kv.atomic()
    .check(distributionRes)
    .set(
      ["distribution:field_count", distributionId],
      new Deno.KvU64(BigInt(uniqueFieldIds.size)),
    )
    .set(["distribution:field_ids", distributionId], uniqueFieldIds)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError(
      `Failed to update Distribution with ID ${distributionId}`,
    );
  }

  return distributionRes.value;
}

async function updateDistributionState(
  { distributionId, state }: {
    distributionId: number;
    state: DistributionState;
  },
): Promise<DistributionModel> {
  const distributionRes = await kv.get<DistributionModel>([
    "distribution",
    distributionId,
  ]);

  if (distributionRes.value === null) {
    throw new GraphQLError(
      `Distribution with ID ${distributionId} not found`,
    );
  }

  switch (distributionRes.value.state) {
    case DistributionState.PREPARING: {
      if (state !== DistributionState.ANSWERING) {
        throw new GraphQLError("State order is violated");
      }

      const update: DistributionModel = {
        ...distributionRes.value,
        state,
        updatedAt: new Date(),
      };

      assertDistribution(update);

      const commitRes = await kv.atomic()
        .check(distributionRes)
        .set(["distribution", distributionId], update)
        .set(
          ["distribution:participant_count", distributionId],
          new Deno.KvU64(0n),
        )
        .set(
          ["distribution:male_participant_ids", distributionId],
          new Set<number>(),
        )
        .set(
          ["distribution:female_participant_ids", distributionId],
          new Set<number>(),
        )
        .commit();

      if (!commitRes.ok) {
        throw new GraphQLError(
          `Failed to update Distribution with ID ${distributionId}`,
        );
      }

      return update;
    }
    case DistributionState.ANSWERING: {
      if (state !== DistributionState.GATHERING) {
        throw new GraphQLError("State order is violated");
      }

      const update: DistributionModel = {
        ...distributionRes.value,
        state,
        updatedAt: new Date(),
      };

      assertDistribution(update);

      // TODO(machnevegor): notify users about the start of the feed

      const commitRes = await kv.atomic()
        .check(distributionRes)
        .set(["distribution", distributionId], update)
        .commit();

      if (!commitRes.ok) {
        throw new GraphQLError(
          `Failed to update Distribution with ID ${distributionId}`,
        );
      }

      return update;
    }
    case DistributionState.GATHERING: {
      if (state !== DistributionState.CLOSED) {
        throw new GraphQLError("State order is violated");
      }

      return await distribute(distributionRes, kv);
    }
    case DistributionState.CLOSED: {
      throw new GraphQLError("Distribution is in CLOSED state");
    }
  }
}

Deno.serve(async () => {
  const userRes = await kv.get<UserModel>(["user", USER_ID]);

  if (userRes.value === null) {
    throw new GraphQLError("User not found");
  }

  if (userRes.value.role !== Role.EDITOR) {
    const update: UserModel = {
      ...userRes.value,
      role: Role.EDITOR,
      updatedAt: new Date(),
    };

    const commitRes = await kv.atomic()
      .check(userRes)
      .set(["user", USER_ID], update)
      .commit();

    if (!commitRes.ok) {
      throw new GraphQLError("Failed to update user");
    }
  }

  const distribution = await createDistribution({ name: "Check-in 2023" });

  const fieldIds = [];
  for (const field of FIELDS) {
    switch (field.type) {
      case FieldType.TEXT: {
        const textField = await createTextField(field);
        fieldIds.push(textField.id);
        break;
      }
      case FieldType.CHOICE: {
        const choiceField = await createChoiceField(field);
        fieldIds.push(choiceField.id);
        break;
      }
    }
  }

  await updateDistributionFields({
    distributionId: distribution.id,
    fieldIds: [...fieldIds],
  });

  await updateDistributionState({
    distributionId: distribution.id,
    state: DistributionState.ANSWERING,
  });

  await updateDistributionState({
    distributionId: distribution.id,
    state: DistributionState.GATHERING,
  });

  return new Response("Done");
});
