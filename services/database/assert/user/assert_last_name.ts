import { GraphQLError } from "../../../../deps.ts";

export function assertLastName(lastName: string) {
  if (!lastName || lastName.length > 64) {
    throw new GraphQLError("Last name should be between 1 and 64 characters");
  }
}
