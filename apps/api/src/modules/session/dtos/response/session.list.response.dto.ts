import { DatabaseUUIDDto } from '@common/database/dtos/database.uuid.dto';
import { ENUM_SESSION_STATUS } from '@modules/session/enums/session.enum';

export class SessionListResponseDto extends DatabaseUUIDDto {

    user: string;

    expiredAt: Date;

    revokeAt?: Date;

    status: ENUM_SESSION_STATUS;

    ip: string;

    hostname: string;

    protocol: string;

    originalUrl: string;

    method: string;

    userAgent?: string;


    xForwardedFor?: string;

    xForwardedHost?: string;

    xForwardedPorto?: string;
}
