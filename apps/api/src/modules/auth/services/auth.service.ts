import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { Algorithm } from 'jsonwebtoken';
import { HelperHashService } from '@common/helper/services/helper.hash.service';
import { HelperStringService } from '@common/helper/services/helper.string.service';
import {
    IAuthJwtAccessTokenPayload,
    IAuthJwtRefreshTokenPayload,
    IAuthPassword,
    IAuthPasswordOptions,
} from '@modules/auth/interfaces/auth.interface';
import { ENUM_AUTH_LOGIN_FROM } from '@repo/shared';
import { AuthLoginResponseDto } from '@modules/auth/dtos/response/auth.login.response.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { UserDocument } from '@modules/users/repository/entities/user.entity';

@Injectable()
export class AuthService {
    // jwt
    private readonly jwtAccessTokenKid: string;
    private readonly jwtAccessTokenExpirationTime: number;

    private readonly jwtRefreshTokenKid: string;
    private readonly jwtRefreshTokenExpirationTime: number;

    private readonly jwtPrefix: string;
    private readonly jwtAudience: string;
    private readonly jwtIssuer: string;
    private readonly jwtAlgorithm: Algorithm;
    private readonly jwtSecret: string;

    // password
    private readonly passwordExpiredIn: number;
    private readonly passwordExpiredTemporary: number;
    private readonly passwordSaltLength: number;

    private readonly passwordAttempt: boolean;
    private readonly passwordMaxAttempt: number;

    constructor(
        private readonly helperHashService: HelperHashService,
        private readonly helperDateService: HelperDateService,
        private readonly helperStringService: HelperStringService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {
        this.jwtSecret = this.configService.get<string>('auth.jwt.secret');
        this.jwtAccessTokenKid = this.configService.get<string>(
            'auth.jwt.accessToken.kid'
        );
        this.jwtAccessTokenExpirationTime = this.configService.get<number>(
            'auth.jwt.accessToken.expirationTime'
        );

        this.jwtRefreshTokenKid = this.configService.get<string>(
            'auth.jwt.refreshToken.kid'
        );
        this.jwtRefreshTokenExpirationTime = this.configService.get<number>(
            'auth.jwt.refreshToken.expirationTime'
        );

        this.jwtPrefix = this.configService.get<string>('auth.jwt.prefix');
        this.jwtAudience = this.configService.get<string>('auth.jwt.audience');
        this.jwtIssuer = this.configService.get<string>('auth.jwt.issuer');
        this.jwtAlgorithm =
            this.configService.get<Algorithm>('auth.jwt.algorithm');

        // password
        this.passwordExpiredIn = this.configService.get<number>(
            'auth.password.expiredIn'
        );
        this.passwordExpiredTemporary = this.configService.get<number>(
            'auth.password.expiredInTemporary'
        );
        this.passwordSaltLength = this.configService.get<number>(
            'auth.password.saltLength'
        );

        this.passwordAttempt = this.configService.get<boolean>(
            'auth.password.attempt'
        );
        this.passwordMaxAttempt = this.configService.get<number>(
            'auth.password.maxAttempt'
        );
    }

    createAccessToken(
        subject: string,
        payload: IAuthJwtAccessTokenPayload
    ): string {
        return this.jwtService.sign(payload, {
            secret: this.jwtSecret,
            expiresIn: this.jwtAccessTokenExpirationTime,
            audience: this.jwtAudience,
            issuer: this.jwtIssuer,
            subject,
            algorithm: this.jwtAlgorithm,
            // keyid: this.jwtAccessTokenKid,s
        } as JwtSignOptions);
    }

    validateAccessToken(subject: string, token: string): boolean {
        try {
            this.jwtService.verify(token, {
                secret: this.jwtSecret,
                algorithms: [this.jwtAlgorithm],
                audience: this.jwtAudience,
                issuer: this.jwtIssuer,
                subject,
            });

            return true;
        } catch {
            return false;
        }
    }

    payload<T = any>(token: string): T {
        return this.jwtService.decode<T>(token);
    }

    createRefreshToken(
        subject: string,
        payload: IAuthJwtRefreshTokenPayload
    ): string {
        return this.jwtService.sign(payload, {
            secret: this.jwtSecret,
            expiresIn: this.jwtRefreshTokenExpirationTime,
            audience: this.jwtAudience,
            issuer: this.jwtIssuer,
            subject,
            algorithm: this.jwtAlgorithm,
            // keyid: this.jwtRefreshTokenKid,
        } as JwtSignOptions);
    }

    validateRefreshToken(subject: string, token: string): boolean {
        try {
            this.jwtService.verify(token, {
                secret: this.jwtSecret,
                algorithms: [this.jwtAlgorithm],
                audience: this.jwtAudience,
                issuer: this.jwtIssuer,
                subject,
            });

            return true;
        } catch {
            return false;
        }
    }

    validateUser(passwordString: string, passwordHash: string): boolean {
        return this.helperHashService.bcryptCompare(
            passwordString,
            passwordHash
        );
    }

    createPayloadAccessToken(
        data: { _id: string; role: string; email: string },
        session: string,
        loginDate: Date,
        loginFrom: ENUM_AUTH_LOGIN_FROM
    ) {
        return {
            user: data._id,
            role: data.role,
            email: data.email,
            session,
            loginDate,
            loginFrom,
        };
    }

    createPayloadRefreshToken({
        user,
        session,
        loginFrom,
        loginDate,
    }: IAuthJwtAccessTokenPayload): IAuthJwtRefreshTokenPayload {
        return {
            user,
            session,
            loginFrom,
            loginDate,
        };
    }

    createSalt(length: number): string {
        return this.helperHashService.randomSalt(length);
    }

    createPassword(
        password: string,
        options?: IAuthPasswordOptions
    ): IAuthPassword {
        const salt: string = this.createSalt(this.passwordSaltLength);

        const today = this.helperDateService.create();
        const passwordExpired: Date = this.helperDateService.forward(
            today,
            this.helperDateService.createDuration({
                seconds: options?.temporary
                    ? this.passwordExpiredTemporary
                    : this.passwordExpiredIn,
            })
        );
        const passwordCreated: Date = this.helperDateService.create();
        const passwordHash = this.helperHashService.bcrypt(password, salt);
        return {
            passwordHash,
            passwordExpired,
            passwordCreated,
            salt,
        };
    }

    createPasswordRandom(): string {
        return this.helperStringService.random(10);
    }

    checkPasswordExpired(passwordExpired: Date): boolean {
        const today: Date = this.helperDateService.create();
        const passwordExpiredConvert: Date =
            this.helperDateService.create(passwordExpired);

        return today > passwordExpiredConvert;
    }

    createToken(user: UserDocument, session: string): AuthLoginResponseDto {
        const loginDate = this.helperDateService.create();

        const payloadAccessToken: IAuthJwtAccessTokenPayload =
            this.createPayloadAccessToken(
                { _id: user._id.toString(), role: user.role, email: user.email },
                session,
                loginDate,
                ENUM_AUTH_LOGIN_FROM.CREDENTIAL
            );
        const accessToken: string = this.createAccessToken(
            user._id.toString(),
            payloadAccessToken
        );

        const payloadRefreshToken: IAuthJwtRefreshTokenPayload =
            this.createPayloadRefreshToken(payloadAccessToken);
        const refreshToken: string = this.createRefreshToken(
            user._id.toString(),
            payloadRefreshToken
        );

        return {
            tokenType: this.jwtPrefix,
            expiresIn: this.jwtAccessTokenExpirationTime,
            accessToken,
            refreshToken,
        };
    }

    refreshToken(
        user: UserDocument,
        refreshTokenFromRequest: string
    ): AuthLoginResponseDto {
        const payloadRefreshToken = this.payload<IAuthJwtRefreshTokenPayload>(
            refreshTokenFromRequest
        );
        const payloadAccessToken: IAuthJwtAccessTokenPayload =
            this.createPayloadAccessToken(
                { _id: user._id.toString(), role: user.role, email: user.email },
                payloadRefreshToken.session,
                payloadRefreshToken.loginDate,
                payloadRefreshToken.loginFrom
            );
        const accessToken: string = this.createAccessToken(
            user._id.toString(),
            payloadAccessToken
        );

        return {
            tokenType: this.jwtPrefix,
            expiresIn: this.jwtAccessTokenExpirationTime,
            accessToken,
            refreshToken: refreshTokenFromRequest,
        };
    }

    getPasswordAttempt(): boolean {
        return this.passwordAttempt;
    }

    getPasswordMaxAttempt(): number {
        return this.passwordMaxAttempt;
    }
}
