export enum DistributionState {
  PREPARING = "preparing",
  ANSWERING = "answering",
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
