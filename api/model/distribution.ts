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

export interface BaseDistributionModel {
  readonly id: number;
  readonly state: DistributionStateModel;
  readonly creatorId: number;
  name: string;
  readonly fieldIds: number[];
  readonly createdAt: Date;
  updatedAt: Date;
}

export interface DistributionPreparingModel extends BaseDistributionModel {
  readonly state: DistributionStateModel.PREPARING;
}

export interface DistributionGatheringModel extends BaseDistributionModel {
  readonly state: DistributionStateModel.GATHERING;
}

export interface DistributionClosedModel extends BaseDistributionModel {
  readonly state: DistributionStateModel.CLOSED;
  readonly groupIds: Set<number>;
}

export type DistributionModel =
  | DistributionPreparingModel
  | DistributionGatheringModel
  | DistributionClosedModel;
