import { IDatabaseDto } from '@repo/shared';
import { Exclude, Expose } from 'class-transformer';

export class DatabaseObjectIdDto implements IDatabaseDto {
    @Expose()
    _id: string;

    @Expose()
    createdAt: Date;

    @Expose()
    createdBy?: string;

    @Expose()
    updatedAt: Date;

    @Expose()
    updatedBy?: string;

    @Expose()
    deleted: boolean;

    @Expose()
    deletedAt?: Date;

    @Expose()
    deletedBy?: string;

    @Exclude()
    __v?: string;
}
