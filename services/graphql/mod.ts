import { GraphQLSchema } from "../../deps.ts";
import { mutation, query } from "./operation/mod.ts";
import {
  AnsweringDistributionNode,
  ChoiceAnswerNode,
  ChoiceFieldNode,
  ClosedDistributionNode,
  GatheringDistributionNode,
  PreparingDistributionNode,
  TextAnswerNode,
  TextFieldNode,
} from "./type/mod.ts";

export const schema = new GraphQLSchema({
  query,
  mutation,
  types: [
    AnsweringDistributionNode,
    ChoiceAnswerNode,
    ChoiceFieldNode,
    ClosedDistributionNode,
    GatheringDistributionNode,
    PreparingDistributionNode,
    TextAnswerNode,
    TextFieldNode,
  ],
});
