import { z } from "../deps.ts";

export const GraphQLParams = z.object({
  query: z.string(),
  variables: z.record(z.unknown()).nullish(),
  operationName: z.string().nullish(),
});
