import { Gender } from "../../database/model/user.ts";

export function genderValidation(gender: string) {
    if (gender === "Male") {
        return Gender.MALE;
    } else {
        return Gender.FEMALE;
    }
  }
