export interface SessionData {
  registrationStep?: RegistrationStep;
  editingStep?: EditingStep;
  userData?: RegistrationPayload;
  previousStep?: RegistrationStep;
  lastBotMessageId?: number;
}

export enum RegistrationStep {
  Name,
  Gender,
  Birthday,
  Bio,
  Next,
  Editing,
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
  gender?: string;
  birthday?: string;
  bio?: string;
}
