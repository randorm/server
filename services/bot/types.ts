import { UserModel, Gender, FieldType } from "./mod.ts";

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
}

export enum RegistrationStep {
  Name,
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
  NameEdition,
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
