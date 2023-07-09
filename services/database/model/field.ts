export enum FieldType {
  TEXT = "text",
  CHOICE = "choice",
}

export interface BaseFieldModel {
  readonly id: number;
  readonly type: FieldType;
  readonly creatorId: number;
  readonly required: boolean;
  readonly question: string;
  readonly createdAt: Date;
}

export interface TextFieldModel extends BaseFieldModel {
  readonly type: FieldType.TEXT;
  readonly format: string | null;
  readonly sample: string | null;
}

export interface ChoiceFieldModel extends BaseFieldModel {
  readonly type: FieldType.CHOICE;
  readonly multiple: boolean;
  readonly options: readonly string[];
}

export type FieldModel = TextFieldModel | ChoiceFieldModel;
