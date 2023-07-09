import { GraphQLError } from "../../../../deps.ts";

export function assertFirstName(firstName: string) {
  if (!firstName || firstName.length > 64) {
    throw new GraphQLError("First name should be between 1 and 64 characters");
  }
}
