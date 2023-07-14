import { UserModel, FieldModel, Gender, FieldType } from "./mod.ts";

export interface SessionData {
  registrationStep?: RegistrationStep;
  editingStep?: EditingStep;
  userData?: RegistrationPayload;
  previousStep?: RegistrationStep;
  lastBotMessageId?: number;
  userModel?: UserModel;
  fieldStep?: FieldStep;
  fieldAmount?: number;
  fieldCurrentIndex?: number;
  fieldsIds?: number[];
  fieldType?: FieldType;
  currentField?: FieldModel;
}

export enum RegistrationStep {
  FirstName,
  SecondName,
  Gender,
  Birthday,
  Bio,
  Finish,
  Editing,
}

export enum FieldStep {
  PROCESS,
  FINISH,
}

export enum EditingStep {
  FirstNameEdition,
  SecondNameEdition,
  GenderEdition,
  BirthdayEdition,
  BioEdition,
  Done,
}

export interface RegistrationPayload {
  name?: string;
  surname?: string;
  gender?: Gender;
  birthday?: string;
  bio?: string;
}

export type InlineButton = {
  text: string;
  callback_data: string;
};