export enum Role {
  EDITOR = "editor",
  VIEWER = "viewer",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

export interface ProfileModel {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthday: Date;
  bio: string;
}

export interface UserModel {
  readonly id: number;
  readonly telegramId: number;
  username: string;
  role: Role;
  profile: ProfileModel;
  readonly createdAt: Date;
  updatedAt: Date;
}
