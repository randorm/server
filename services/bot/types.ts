import { SessionFlavor } from "https://deno.land/x/grammy@v1.17.1/mod.ts";
import { Context } from "../../deps.ts";

export interface SessionData {
    registrationStep?: RegistrationStep;
    editingStep?: EditingStep;
    userData?: UserData;
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
  
export interface UserData {
    name?: string;
    surname?: string;
    gender?: string;
    birthday?: string;
    bio?: string;
  }

export type MyContext = Context & SessionFlavor<SessionData>;