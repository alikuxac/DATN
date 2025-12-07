import { InjectConnection, Schema, PropOptions, SchemaFactory, Prop, InjectModel } from '@nestjs/mongoose';
import { SchemaOptions, Schema as MongooseSchema } from 'mongoose';
import { IDatabaseQueryContainOptions } from '@common/database/interfaces/database.interface';
import { DATABASE_CONNECTION_NAME } from '@common/database/constants/database.constant';
import { Type } from '@nestjs/common';

export function InjectDatabaseConnection(
    connectionName?: string
): ParameterDecorator {
    return InjectConnection(connectionName ?? DATABASE_CONNECTION_NAME);
}

export function InjectDatabaseModel(
    entity: any,
    connectionName?: string
): ParameterDecorator {
    return InjectModel(entity, connectionName ?? DATABASE_CONNECTION_NAME);
}

export function DatabaseEntity(options?: SchemaOptions): ClassDecorator {
    return Schema({
        ...options,
        versionKey: false,
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        },
    });
}

export function DatabaseProp(options?: PropOptions): PropertyDecorator {
    return Prop(options);
}

export function DatabaseSchema<T = any, N = MongooseSchema<T>>(
    entity: Type<T>
): N {
    return SchemaFactory.createForClass<T>(entity) as N;
}

export function DatabaseHelperQueryContain(
    field: string,
    value: string,
    options?: IDatabaseQueryContainOptions
) {
    if (options?.fullWord) {
        return {
            [field]: {
                $regex: new RegExp(`\\b${value}\\b`),
                $options: 'i',
            },
        };
    }

    return {
        [field]: {
            $regex: new RegExp(value),
            $options: 'i',
        },
    };
}
