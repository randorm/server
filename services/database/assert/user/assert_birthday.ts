import { difference, GraphQLError } from "../../../../deps.ts";

export function assertBirthday(birthday: Date) {
  const { years } = difference(birthday, new Date(), { units: ["years"] });

  if (!years || years < 4 || years > 120) {
    throw new GraphQLError("Birthday should be between 4 and 120 years ago");
  }
}
