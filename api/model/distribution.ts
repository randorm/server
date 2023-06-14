export enum DistributionStateModel {
  PREPARING = "preparing",
  GATHERING = "gathering",
  CLOSED = "closed",
}

export interface GroupModel {
  readonly id: number;
  readonly distributionId: number;
  readonly memberIds: Set<number>;
  readonly createdAt: Date;
}

export interface DistributionModel {
  readonly id: number;
  readonly state: DistributionStateModel;
  readonly creatorId: number;
  name: string;
  readonly fieldIds: number[];
  readonly groupIds: Set<number> | null;
  readonly createdAt: Date;
  updatedAt: Date;
}
