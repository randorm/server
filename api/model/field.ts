export enum FieldTypeModel {
  TEXT = "text",
  CHOICE = "choice",
}

export interface BaseFieldModel {
  readonly id: number;
  readonly type: FieldTypeModel;
  readonly creatorId: number;
  readonly required: boolean;
  readonly question: string;
  readonly createdAt: Date;
}

export interface TextFieldModel extends BaseFieldModel {
  readonly type: FieldTypeModel.TEXT;
  readonly format: string | null;
  readonly sample: string | null;
}

export interface ChoiceFieldModel extends BaseFieldModel {
  readonly type: FieldTypeModel.CHOICE;
  readonly multiple: boolean;
  readonly options: readonly string[];
}

export type FieldModel = TextFieldModel | ChoiceFieldModel;
