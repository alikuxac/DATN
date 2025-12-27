import { DatabaseUUIDDto } from '@common/database/dtos/database.uuid.dto';
import { ENUM_SESSION_STATUS, ISessionListResponse } from '@repo/shared';
import { Exclude, Expose } from 'class-transformer';
import { UAParser } from 'ua-parser-js';

export class SessionListResponseDto extends DatabaseUUIDDto implements ISessionListResponse {

    @Expose()
    user: string;

    @Expose()
    expiredAt: Date;

    @Expose()
    revokeAt?: Date;

    @Expose()
    status: ENUM_SESSION_STATUS;

    @Expose()
    ip: string;

    @Exclude()
    hostname: string;
    @Exclude()
    protocol: string;
    @Exclude()
    originalUrl: string;
    @Exclude()
    method: string;
    @Exclude()
    userAgent?: string; 
    @Exclude()
    xForwardedFor?: string;
    @Exclude()
    xForwardedHost?: string;
    @Exclude()
    xForwardedPorto?: string;

    @Expose()
    get deviceName(): string {
        if (!this.userAgent) return 'Unknown Device';
        const parser = new UAParser(this.userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = parser.getDevice();

        // Logic đặt tên thông minh
        if (device.model) {
            return `${device.vendor || ''} ${device.model}`.trim(); // VD: Apple iPhone 13
        }
        return `${browser.name || 'Unknown'} on ${os.name || 'Unknown'}`; // VD: Chrome on Windows
    }

    @Expose()
    get os(): string {
        if (!this.userAgent) return 'Unknown';
        const parser = new UAParser(this.userAgent);
        return parser.getOS().name || 'Unknown'; // VD: Android, iOS, Windows
    }

    @Expose()
    get lastActiveAt(): Date {
        // Tạm thời dùng createdAt hoặc updatedAt của session
        return this['createdAt'] || new Date();
    }

    @Expose()
    isCurrent: boolean;
}
