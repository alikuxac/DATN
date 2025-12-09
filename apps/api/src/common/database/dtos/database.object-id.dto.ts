import { IDatabaseDto } from '@repo/shared';
import { Exclude } from 'class-transformer';

export class DatabaseObjectIdDto implements IDatabaseDto {
    _id: string;

    createdAt: Date;

    createdBy?: string;

    updatedAt: Date;

    updatedBy?: string;

    deleted: boolean;

    deletedAt?: Date;

    deletedBy?: string;

    @Exclude()
    __v?: string;
}
