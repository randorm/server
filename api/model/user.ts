export enum RoleModel {
  EDITOR = "editor",
  VIEWER = "viewer",
}

export enum GenderModel {
  MALE = "male",
  FEMALE = "female",
}

export interface ProfileModel {
  firstName: string;
  lastName: string;
  gender: GenderModel;
  birthday: Date;
  bio: string;
}

export interface UserModel {
  readonly id: number;
  username: string;
  role: RoleModel;
  profile: ProfileModel;
  fieldIds: Set<number>;
  roomId: number | null;
  readonly createdAt: Date;
  updatedAt: Date;
}
