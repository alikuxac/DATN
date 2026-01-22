import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Document, Types } from 'mongoose';

import { UserDocument, UserEntity } from '@modules/users/repository/entities/user.entity';

import { UserCreateRequestDto } from '@modules/users/dto/request/user.create.request.dto';
import { UserUpdateRequestDto } from '@modules/users/dto/request/user.update.request.dto';

import { IAuthPassword } from '@modules/auth/interfaces/auth.interface';
import { IDatabaseCreateOptions, IDatabaseDeleteManyOptions, IDatabaseExistsOptions, IDatabaseFindAllOptions, IDatabaseFindOneOptions, IDatabaseGetTotalOptions, IDatabaseSaveOptions, IDatabaseSoftDeleteOptions } from '@common/database/interfaces/database.interface';
import { UserRepository } from '@modules/users/repository/repositories/user.repository';
import { DatabaseHelperQueryContain } from '@common/database/decorators/database.decorator';
import { ENUM_MESSAGE_LANGUAGE, ENUM_USER_ROLE, ENUM_USER_SIGN_UP_FROM, ENUM_USER_STATUS, ENUM_USER_THEME, ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { plainToInstance } from 'class-transformer';
import { UserUpdateSettingsDto } from '../dto/request/user.update-settings.request.dto';
import { RedisService } from '@common/redis/services/redis.service';
import { UserProfileResponseDto } from '@modules/users/dto/response/user.profile.response.dto';
import { UserCensorResponseDto } from '@modules/users/dto/response/user.censor.response.dto';
import { UserListResponseDto } from '@modules/users/dto/response/user.list.response.dto';
import { UserShortResponseDto } from '@modules/users/dto/response/user.short.response.dto';
import { UserGetResponseDto } from '@modules/users/dto/response/user.get.response.dto';
import { UserUpdateStatusRequestDto } from '@modules/users/dto/request/user.update-status.request.dto';
import { UserUpdateProfileRequestDto } from '@modules/users/dto/request/user.update-profile.request.dto';
import { UserUpdatePreferencesRequestDto } from '../dto/request/user.update-preferences.request.dto';
import { HelperStringService } from '@common/helper/services/helper.string.service';
@Injectable()
export class UsersService {
  private readonly ONLINE_USERS_SET = 'users:online:set';
  private readonly ONLINE_USERS_COUNTS = 'users:online:counts';

  constructor(
    private readonly userRepository: UserRepository,
    private readonly helperDateService: HelperDateService,
    private readonly helperStringService: HelperStringService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly redisService: RedisService
  ) { }

  async onModuleInit() {
    // Strategy 1: Reset Data on Start (Prevent Ghost Users from previous crash)
    const client = this.redisService.client;
    if (client) {
      await client.del(this.ONLINE_USERS_SET, this.ONLINE_USERS_COUNTS);
    }
  }

  async userConnected(userId: string) {
    try {
      const client = this.redisService.client;
      const count = await client.hincrby(this.ONLINE_USERS_COUNTS, userId, 1);
      if (count === 1) {
        await client.sadd(this.ONLINE_USERS_SET, userId);
      }
    } catch (e) {
      console.error('Redis error tracking user connection', e);
    }
  }

  async userDisconnected(userId: string) {
    try {
      const client = this.redisService.client;
      const count = await client.hincrby(this.ONLINE_USERS_COUNTS, userId, -1);
      if (count <= 0) {
        await client.srem(this.ONLINE_USERS_SET, userId);
        await client.hdel(this.ONLINE_USERS_COUNTS, userId);
      }
    } catch (e) {
      console.error('Redis error tracking user disconnection', e);
    }
  }

  async getOnlineCount(): Promise<number> {
    try {
      return await this.redisService.client.scard(this.ONLINE_USERS_SET);
    } catch (e) {
      console.error('Redis error getting online count', e);
      return 0;
    }
  }

  async updateLastOnline(userId: string) {
    // 1. Update Redis (Fast path) for Online Status
    // We can also use this to throttle DB updates if needed
    // But since `lastOnlineAt` is important, we might want to persist it.

    // OPTIMIZATION: Only update MongoDB if last update was > 1-2 minutes ago?
    // OR: Just fire and forget update to DB (allow background processing).

    // For now, straight update to DB is safest for "Last Seen" feature accuracy.
    // However, if `update_location` calls this every 5s, we will kill the DB.

    // Strategy: Use Redis Key `user:last_online_update:${userId}` with TTL 60s.
    // If key exists, skip DB update. If not, update DB and set key.

    try {
      const key = `user:last_online_update:${userId}`;
      const exists = await this.redisService.client.get(key);

      if (!exists) {
        // Update MongoDB
        await this.userRepository.updateRaw({ _id: userId }, {
          lastOnlineAt: this.helperDateService.create()
        });

        // Set throttle key for 60 seconds
        await this.redisService.client.set(key, '1', 'EX', 60);
      }
    } catch (error) {
      console.error('Error updating lastOnlineAt', error);
    }
  }

  async create(
    { email, password, firstName, lastName }: UserCreateRequestDto,
    { passwordCreated, passwordExpired, passwordHash }: IAuthPassword,
    signUpFrom: ENUM_USER_SIGN_UP_FROM,
    options?: IDatabaseCreateOptions
  ) {
    const newUser = new UserEntity();

    newUser.email = email;
    newUser.password = password;
    newUser.firstName = firstName;
    newUser.lastName = lastName;

    newUser.signUpFrom = signUpFrom;

    newUser.passwordCreatedAt = passwordCreated;
    newUser.passwordExpiredAt = passwordExpired;
    newUser.password = passwordHash;

    newUser.verification = {
      email: false,
      emailVerfiedAt: null,
      mobileNumber: false,
      mobileNumberVerifiedAt: null
    }

    newUser.preferences = {
      language: ENUM_MESSAGE_LANGUAGE.VI,
      theme: ENUM_USER_THEME.LIGHT
    };

    newUser.settings = {
      pushEnabled: true,
      sosAlerts: true,
      activityUpdates: true,
      newsLetters: true
    }

    return this.userRepository.create<UserEntity>(newUser, options);
  }

  async findAll(
    find: Record<string, any>,
    options?: IDatabaseFindAllOptions
  ) {
    return this.userRepository.findAll<UserDocument>(find, options);
  }

  async findAllIdsByName(search: string): Promise<string[]> {
    const users = await this.userRepository.findAll<UserDocument>({
      $or: [
        {
          $expr: {
            $regexMatch: {
              input: {
                $concat: ['$lastName', ' ', '$firstName'],
              },
              regex: search,
              options: 'i',
            },
          },
        },
        {
          $expr: {
            $regexMatch: {
              input: {
                $concat: ['$firstName', ' ', '$lastName'],
              },
              regex: search,
              options: 'i',
            },
          },
        },
      ],
    });

    return users.map((user) => user._id.toString());
  }

  async findOneById(id: string, options?: IDatabaseFindOneOptions) {
    // If there are options (like session or populate), don't cache or handle carefully
    if (options) {
      return this.userRepository.findOneById<UserDocument>(id, options);
    }

    const cacheKey = `user:info:${id}`;
    const cachedUser = await this.cacheManager.get<UserDocument>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.userRepository.findOneById<UserDocument>(id);
    if (user) {
      await this.cacheManager.set(cacheKey, user, 60000); // 1 minute cache
    }

    return user;
  }

  async findOne(find: Record<string, any>, options?: IDatabaseFindOneOptions) {
    return this.userRepository.findOne<UserDocument>(find, options);
  }

  async findOneByEmail(email: string, options?: IDatabaseFindOneOptions) {
    return this.userRepository.findOne<UserDocument>(
      DatabaseHelperQueryContain('email', email, { fullWord: true }),
      options
    );
  }

  async findOneActiveByEmail(
    email: string,
    options?: IDatabaseFindOneOptions
  ) {
    return this.userRepository.findOne<UserDocument>(
      {
        ...DatabaseHelperQueryContain('email', email, {
          fullWord: true,
        }),
        status: ENUM_USER_STATUS.ACTIVE,
      },
      {
        ...options,
      }
    );
  }

  async update(repository: UserDocument, updateUserDto: UserUpdateRequestDto, options?: IDatabaseSaveOptions) {
    if (updateUserDto.email && updateUserDto.email !== repository.email) {
      const emailExist = await this.userRepository.exists(
        DatabaseHelperQueryContain('email', updateUserDto.email, { fullWord: true }),
        { excludeId: repository._id.toString() }
      );

      if (emailExist) {
        throw new ConflictException({
          statusCode: ENUM_STATUS_CODE_ERROR.USER_EMAIL_EXIST,
          message: 'user.error.emailExist',
        });
      }
      repository.email = updateUserDto.email;
    }

    repository.firstName = updateUserDto.firstName;
    repository.lastName = updateUserDto.lastName;
    repository.gender = updateUserDto.gender;
    repository.mobileNumber = updateUserDto.mobileNumber;

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async remove(id: string, options?: IDatabaseSaveOptions) {
    const user = await this.userRepository.findOneById<UserDocument>(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepository.softDelete(user, options);
  }

  async softDelete(
    repository: UserDocument,
    options?: IDatabaseSoftDeleteOptions
  ): Promise<UserDocument> {
    const deleted = await this.userRepository.softDelete(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return deleted;
  }

  async restore(
    id: string,
    options?: IDatabaseSaveOptions
  ): Promise<UserDocument> {
    const user = await this.userRepository.findOneById<UserDocument>(id, {
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepository.restore(user, options);
  }

  async deleteMany(
    find?: Record<string, any>,
    options?: IDatabaseDeleteManyOptions
  ): Promise<boolean> {
    await this.userRepository.deleteMany(find, options);

    return true;
  }

  async getTotalActive(
    find?: Record<string, any>,
    options?: IDatabaseGetTotalOptions
  ): Promise<number> {
    return this.userRepository.getTotal(
      { ...find, status: ENUM_USER_STATUS.ACTIVE },
      {
        ...options,
      }
    );
  }

  async getTotal(
    find?: Record<string, any>,
    options?: IDatabaseGetTotalOptions
  ): Promise<number> {
    return this.userRepository.getTotal(find, options);
  }

  async updatePassword(user: UserDocument, data: IAuthPassword, options?: IDatabaseSaveOptions) {

    user.password = data.passwordHash;
    user.passwordCreatedAt = data.passwordCreated;
    user.passwordExpiredAt = data.passwordExpired;
    user.passwordAttempts = 0;

    const updated = await this.userRepository.save(user, options);
    await this.cacheManager.del(`user:info:${user._id}`);
    return updated;
  }

  async resetPasswordAttempt(
    user: UserDocument,
    options?: IDatabaseSaveOptions
  ) {
    user.passwordAttempts = 0;

    const updated = await this.userRepository.save(user, options);
    await this.cacheManager.del(`user:info:${user._id}`);
    return updated;
  }

  async increasePasswordAttempt(
    user: UserDocument,
    options?: IDatabaseSaveOptions
  ) {
    user.passwordAttempts += 1;

    const updated = await this.userRepository.save(user, options);
    await this.cacheManager.del(`user:info:${user._id}`);
    return updated;
  }

  async existByEmail(
    email: string,
    options?: IDatabaseExistsOptions
  ): Promise<boolean> {
    return this.userRepository.exists(
      DatabaseHelperQueryContain('email', email, { fullWord: true }),
      options
    );
  }

  async updateVerificationEmail(
    repository: UserDocument,
    options?: IDatabaseSaveOptions
  ): Promise<UserDocument> {
    repository.verification.email = true;
    repository.verification.emailVerfiedAt =
      this.helperDateService.create();

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async updateVerificationMobileNumber(
    repository: UserDocument,
    options?: IDatabaseSaveOptions
  ): Promise<UserDocument> {
    repository.verification.mobileNumber = true;
    repository.verification.mobileNumberVerifiedAt =
      this.helperDateService.create();

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async updateMobileNumber(
    repository: UserDocument,
    mobileNumber: string,
    options?: IDatabaseSaveOptions
  ): Promise<UserDocument> {
    repository.mobileNumber = mobileNumber;
    repository.verification.mobileNumber = false;
    repository.verification.mobileNumberVerifiedAt = null;

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }


  async updateStatus(
    repository: UserDocument,
    { status }: UserUpdateStatusRequestDto,
    options?: IDatabaseSaveOptions
  ) {
    repository.status = status;

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async updateRole(
    repository: UserDocument,
    { role }: { role: ENUM_USER_ROLE },
    options?: IDatabaseSaveOptions
  ) {
    repository.role = role;

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async updateProfile(
    repository: UserDocument,
    { lastName, firstName, gender, mobileNumber }: UserUpdateProfileRequestDto,
    options?: IDatabaseSaveOptions
  ) {
    repository.lastName = lastName;
    repository.firstName = firstName;
    repository.gender = gender;
    repository.mobileNumber = mobileNumber;

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async updatePreferences(
    repository: UserDocument,
    { language, theme }: UserUpdatePreferencesRequestDto,
    options?: IDatabaseSaveOptions
  ) {
    repository.preferences.language = language;
    repository.preferences.theme = theme;

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async updateLocation(
    repository: UserDocument,
    latitude: number,
    longitude: number,
    options?: IDatabaseSaveOptions
  ) {
    repository.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    }

    repository.lastLocationAt = this.helperDateService.create();
    // Also update online status
    repository.lastOnlineAt = repository.lastLocationAt;

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async updateExpoPushToken(
    repository: UserDocument,
    expoPushToken: string,
    options?: IDatabaseSaveOptions
  ) {
    repository.expoPushToken = expoPushToken;

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async updateNotificationSettings(
    repository: UserDocument,
    { pushEnabled, sosAlerts, activityUpdates, newsLetters }: UserUpdateSettingsDto,
    options?: IDatabaseSaveOptions
  ) {
    repository.settings.pushEnabled = pushEnabled;
    repository.settings.sosAlerts = sosAlerts;
    repository.settings.activityUpdates = activityUpdates;
    repository.settings.newsLetters = newsLetters;

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async updateVolunteerStatus(
    repository: UserDocument,
    options?: IDatabaseSaveOptions
  ) {

    if (repository.role === ENUM_USER_ROLE.ADMIN
      || repository.role === ENUM_USER_ROLE.SUPER_ADMIN) {
      repository.isRescueMode = !repository.isRescueMode;
    }

    if (repository.role === ENUM_USER_ROLE.VOLUNTEER) {
      repository.role = ENUM_USER_ROLE.USER;
      repository.isRescueMode = false;
    } else if (repository.role === ENUM_USER_ROLE.USER) {
      repository.role = ENUM_USER_ROLE.VOLUNTEER;
      repository.isRescueMode = true;
    }

    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async updateAvatar(
    repository: UserDocument,
    avatarUrl: string | null,
    options?: IDatabaseSaveOptions
  ): Promise<UserDocument> {
    repository.avatar = avatarUrl;
    const updated = await this.userRepository.save(repository, options);
    await this.cacheManager.del(`user:info:${repository._id}`);
    return updated;
  }

  async signUp(
    data: IAuthPassword,
    { email, firstName, lastName }: { email: string, lastName: string, firstName: string },
    language: ENUM_MESSAGE_LANGUAGE,
    theme: ENUM_USER_THEME | undefined,
    signUpFrom: ENUM_USER_SIGN_UP_FROM,
    options?: IDatabaseCreateOptions) {
    const user = new UserEntity();

    user.email = email;
    user.password = data.passwordHash;
    user.passwordCreatedAt = data.passwordCreated;
    user.passwordExpiredAt = data.passwordExpired;
    user.firstName = firstName;
    user.lastName = lastName;
    user.signUpDate = this.helperDateService.create();
    user.signUpFrom = signUpFrom;

    user.verification = {
      email: false,
      emailVerfiedAt: null,
      mobileNumber: false,
      mobileNumberVerifiedAt: null
    }

    user.preferences = {
      language: language,
      theme: theme ?? ENUM_USER_THEME.LIGHT
    };

    user.settings = {
      pushEnabled: true,
      sosAlerts: true,
      activityUpdates: true,
      newsLetters: true
    }

    const newUser = await this.userRepository.create<UserEntity>(user, options);
    return newUser;
  }

  mapProfile(user: UserDocument | UserEntity) {
    return plainToInstance(
      UserProfileResponseDto,
      user instanceof Document ? user.toObject() : user
    );
  }

  mapCensor(user: UserDocument | UserEntity) {
    const plainObject = user instanceof Document ? user.toObject() : user;
    plainObject.firstName = this.helperStringService.censor(plainObject.firstName);
    plainObject.lastName = this.helperStringService.censor(plainObject.lastName);

    return plainToInstance(UserCensorResponseDto, plainObject);
  }

  mapList(users: UserDocument[] | UserEntity[]): UserListResponseDto[] {
    return plainToInstance(
      UserListResponseDto,
      users.map((u: UserDocument | UserEntity) =>
        u instanceof Document ? u.toObject() : u
      )
    );
  }

  mapShort(users: UserDocument[] | UserEntity[]): UserShortResponseDto[] {
    return plainToInstance(
      UserShortResponseDto,
      users.map((u: UserDocument | UserEntity) =>
        u instanceof Document ? u.toObject() : u
      )
    );
  }

  mapGet(user: UserDocument | UserEntity): UserGetResponseDto {
    return plainToInstance(
      UserGetResponseDto,
      user instanceof Document ? user.toObject() : user
    );
  }

  // SOS / Report function
  async findRescuersNearby(lat: number, long: number, radiusInMeters: number, find?: Record<string, any>, options?: IDatabaseFindAllOptions) {
    return this.userRepository.findAll({
      ...find,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [long, lat] },
          $maxDistance: radiusInMeters
        }
      },
      'settings.pushEnabled': true,
      'settings.sosAlerts': true,
      'isRescueMode': true,
      status: ENUM_USER_STATUS.ACTIVE,
    }, options);
  }

  async getNearbyVolunteer(user: UserDocument, lat?: number, lng?: number, options?: IDatabaseFindAllOptions) {
    const targetLat = lat ?? user.location?.coordinates?.[1];
    const targetLng = lng ?? user.location?.coordinates?.[0];

    if (!targetLat || !targetLng) return [];

    return this.findRescuersNearby(
      targetLat,
      targetLng,
      10000,
      { _id: { $ne: user._id } },
      options
    ); // 10km radius
  }

  async getGrowthStats(startDate: Date, endDate: Date, timezone = '+07:00') {
    return this.userRepository.findAllAggregate<{ _id: string; count: number }>([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getDeletedStats(startDate: Date, endDate: Date, timezone = '+07:00') {
    return this.userRepository.findAllAggregate<{ _id: string; count: number }>([
      {
        $match: {
          deletedAt: { $gte: startDate, $lte: endDate },
          deleted: true
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$deletedAt', timezone } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}
