import { z } from "../deps.ts";

export const AuthenticationData = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

export const GraphQLParams = z.object({
  query: z.string(),
  variables: z.record(z.unknown()).nullish(),
  operationName: z.string().nullish(),
});
