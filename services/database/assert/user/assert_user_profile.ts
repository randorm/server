import type { ProfileModel } from "../../model/mod.ts";
import {
  assertBio,
  assertBirthday,
  assertFirstName,
  assertLastName,
} from "./mod.ts";

export function assertUserProfile(profile: ProfileModel) {
  assertFirstName(profile.firstName);
  assertLastName(profile.lastName);
  assertBirthday(profile.birthday);
  assertBio(profile.bio);
}
