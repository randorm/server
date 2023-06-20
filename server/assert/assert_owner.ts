import { GraphQLError } from "../deps.ts";
import type { UserModel } from "../model/mod.ts";
import { Role } from "../model/mod.ts";

export function assertOwner(user: UserModel, id: number) {
  if (user.role !== Role.EDITOR && user.id !== id) {
    throw new GraphQLError("User has no access to the data");
  }
}
