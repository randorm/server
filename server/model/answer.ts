import { FieldType } from "./mod.ts";

export interface BaseAnswerModel {
  readonly fieldId: number;
  readonly respondentId: number;
  readonly type: FieldType;
  readonly creadtedAt: Date;
  updatedAt: Date;
}

export interface TextAnswerModel extends BaseAnswerModel {
  readonly type: FieldType.TEXT;
  value: string;
}

export interface ChoiceAnswerModel extends BaseAnswerModel {
  readonly type: FieldType.CHOICE;
  value: Set<number>;
}

export type AnswerModel = TextAnswerModel | ChoiceAnswerModel;
