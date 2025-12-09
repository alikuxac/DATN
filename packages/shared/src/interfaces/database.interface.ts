export interface IDatabaseDto {
  _id: string;

  createdAt: Date;

  createdBy?: string;

  updatedAt: Date;

  updatedBy?: string;

  deleted: boolean;

  deletedAt?: Date;

  deletedBy?: string;

  __v?: string;
}