import { FieldTypeModel } from "./mod.ts";

export interface BaseAnswerModel {
  readonly fieldId: number;
  readonly respondentId: number;
  readonly type: FieldTypeModel;
  readonly creadtedAt: Date;
  updatedAt: Date;
}

export interface TextAnswerModel extends BaseAnswerModel {
  readonly type: FieldTypeModel.TEXT;
  value: string;
}

export interface ChoiceAnswerModel extends BaseAnswerModel {
  readonly type: FieldTypeModel.CHOICE;
  value: Set<number>;
}

export type AnswerModel = TextAnswerModel | ChoiceAnswerModel;
