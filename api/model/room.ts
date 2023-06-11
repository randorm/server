export interface RoomGroupModel {
  readonly id: number;
  readonly name: string;
  readonly creatorId: number;
  roomIds: Set<number>;
  readonly createdAt: Date;
  updatedAt: Date;
}

export interface RoomModel {
  readonly id: number;
  name: string;
  readonly creatorId: number;
  capacity: number;
  price: number;
  groupIds: Set<number>;
  memberIds: Set<number>;
  readonly createdAt: Date;
  updatedAt: Date;
}
