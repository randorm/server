export interface GroupModel {
  readonly id: number;
  readonly distributionId: number;
  readonly memberIds: Set<number>;
  readonly createdAt: Date;
}
