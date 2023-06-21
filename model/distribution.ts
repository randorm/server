export enum DistributionState {
  PREPARING = "preparing",
  GATHERING = "gathering",
  CLOSED = "closed",
}

export interface DistributionModel {
  readonly id: number;
  readonly state: DistributionState;
  readonly creatorId: number;
  name: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
