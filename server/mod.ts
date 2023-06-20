import { serve } from "https://deno.land/std@0.191.0/http/server.ts";
import { Status } from "https://deno.land/std@0.192.0/http/http_status.ts";
import { renderPlaygroundPage } from "https://esm.sh/graphql-playground-html@1.6.30";
import { graphql } from "https://esm.sh/graphql@16.5.0";
import { GraphQLError, GraphQLSchema } from "./deps.ts";
import type { UserModel } from "./model/mod.ts";
import { Gender, Role } from "./model/mod.ts";
import { Mutation, Query } from "./operation/mod.ts";
import {
  ChoiceAnswerNode,
  ChoiceFieldNode,
  ClosedDistributionNode,
  GatheringDistributionNode,
  PreparingDistributionNode,
  TextAnswerNode,
  TextFieldNode,
} from "./type/mod.ts";

////////////////////////////////////////////////////////////////

// Step 1. Create a GraphQL schema.

export const schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
  types: [
    ChoiceAnswerNode,
    ChoiceFieldNode,
    ClosedDistributionNode,
    GatheringDistributionNode,
    PreparingDistributionNode,
    TextAnswerNode,
    TextFieldNode,
  ],
});

////////////////////////////////////////////////////////////////

// Step 2.1. Create a connection to the database.

const kv = await Deno.openKv();

// Step 2.2. Setup the database keys.

// Distribution keys

const distributionOperation = kv.atomic();

const distributionNextIdRes = await kv.get<Deno.KvU64>([
  "distribution_next_id",
]);

if (distributionNextIdRes.value === null) {
  distributionOperation
    .check(distributionNextIdRes)
    .sum(["distribution_next_id"], 1n);
}

const distributionCountRes = await kv.get<Deno.KvU64>(["distribution_count"]);

if (distributionCountRes.value === null) {
  distributionOperation
    .check(distributionCountRes)
    .sum(["distribution_count"], 0n);
}

if (
  distributionNextIdRes.value === null || distributionCountRes.value === null
) {
  const commitRes = await distributionOperation.commit();

  if (!commitRes.ok) {
    throw new Error("Failed to setup Distribution keys");
  }
}

// Field keys

const fieldOperation = kv.atomic();

const fieldNextIdRes = await kv.get<Deno.KvU64>(["field_next_id"]);

if (fieldNextIdRes.value === null) {
  fieldOperation
    .check(fieldNextIdRes)
    .sum(["field_next_id"], 1n);
}

const fieldCountRes = await kv.get<Deno.KvU64>(["field_count"]);

if (fieldCountRes.value === null) {
  fieldOperation
    .check(fieldCountRes)
    .sum(["field_count"], 0n);
}

if (fieldNextIdRes.value === null || fieldCountRes.value === null) {
  const commitRes = await fieldOperation.commit();

  if (!commitRes.ok) {
    throw new Error("Failed to setup Field keys");
  }
}

// Group keys

const groupOperation = kv.atomic();

const groupNextIdRes = await kv.get<Deno.KvU64>(["group_next_id"]);

if (groupNextIdRes.value === null) {
  groupOperation
    .check(groupNextIdRes)
    .sum(["group_next_id"], 1n);
}

const groupCountRes = await kv.get<Deno.KvU64>(["group_count"]);

if (groupCountRes.value === null) {
  groupOperation
    .check(groupCountRes)
    .sum(["group_count"], 0n);
}

if (groupNextIdRes.value === null || groupCountRes.value === null) {
  const commitRes = await groupOperation.commit();

  if (!commitRes.ok) {
    throw new Error("Failed to setup Group keys");
  }
}

// User keys

const userOperation = kv.atomic();

const userNextIdRes = await kv.get<Deno.KvU64>(["user_next_id"]);

if (userNextIdRes.value === null) {
  userOperation
    .check(userNextIdRes)
    .sum(["user_next_id"], 1n);
}

const userCountRes = await kv.get<Deno.KvU64>(["user_count"]);

if (userCountRes.value === null) {
  userOperation
    .check(userCountRes)
    .sum(["user_count"], 0n);
}

if (userNextIdRes.value === null || userCountRes.value === null) {
  const commitRes = await userOperation.commit();

  if (!commitRes.ok) {
    throw new Error("Failed to setup User keys");
  }
}

////////////////////////////////////////////////////////////////

// Step 3. Setup a test User.

const userRes = await kv.get<UserModel>(["user", 1]);

if (userRes.value === null) {
  const user: UserModel = {
    id: 1,
    telegramId: 709491996,
    username: "machnevegor",
    role: Role.EDITOR,
    profile: {
      firstName: "Egor",
      lastName: "Machnev",
      gender: Gender.MALE,
      birthday: new Date(2004, 8, 28),
      bio: "Deno, Python, and Rust. Doofenshmirtz Evil Inc.",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const firstRes = await kv.atomic()
    .check(userRes)
    .set(["user:viewed_ids", user.id], new Set())
    .set(["user:subscription_ids", user.id], new Set())
    .set(["user:subscriber_ids", user.id], new Set())
    .sum(["user:views", user.id], 0n)
    .sum(["user:viewed_count", user.id], 0n)
    .sum(["user:subscription_count", user.id], 0n)
    .sum(["user:subscriber_count", user.id], 0n)
    .commit();

  if (!firstRes.ok) {
    throw new Error("Failed to setup User");
  }

  const secondRes = await kv.atomic()
    .check(userRes)
    .set(["user", user.id], user)
    .set(["user:field_ids", user.id], new Set())
    .set(["user:distribution_ids", user.id], new Set())
    .set(["user:group_ids", user.id], new Set())
    .sum(["user:field_count", user.id], 0n)
    .sum(["user:distribution_count", user.id], 0n)
    .sum(["user:group_count", user.id], 0n)
    .sum(["user_count"], 1n)
    .sum(["user_next_id"], 1n)
    .commit();

  if (!secondRes.ok) {
    throw new Error("Failed to setup User");
  }
}

////////////////////////////////////////////////////////////////

serve(
  async (req: Request) => {
    switch (req.method) {
      case "GET":
        return new Response(
          renderPlaygroundPage({ endpoint: "/" }),
          { headers: { "content-type": "text/html" } },
        );
      case "POST": {
        const data = await req.json();

        const userRes = await kv.get<UserModel>(["user", 1]);

        try {
          if (userRes.value === null) {
            throw new GraphQLError("Test User not found");
          }

          const result = await graphql({
            schema,
            source: data.query,
            variableValues: data.variables,
            operationName: data.operationName,
            contextValue: {
              kv,
              userRes,
              user: userRes.value,
            },
          });

          return Response.json(result);
        } catch (e) {
          return Response.json(
            { errros: [e], data: null },
            { status: Status.BadRequest },
          );
        }
      }
      default:
        return new Response(
          "Method Not Allowed",
          { status: Status.MethodNotAllowed },
        );
    }
  },
  { port: 3000 },
);
