import { GraphQLEnumType } from "../deps.ts";

export const GenderEnum = new GraphQLEnumType({
  name: "Gender",
  values: {
    MALE: {
      value: "male",
    },
    FEMALE: {
      value: "female",
    },
  },
});
