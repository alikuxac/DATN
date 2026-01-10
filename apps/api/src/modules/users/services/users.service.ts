import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
import { HelperStringService } from '@common/helper/services/helper.string.service';
import { UserProfileResponseDto } from '@modules/users/dto/response/user.profile.response.dto';
import { UserCensorResponseDto } from '@modules/users/dto/response/user.censor.response.dto';
import { UserListResponseDto } from '@modules/users/dto/response/user.list.response.dto';
import { UserShortResponseDto } from '@modules/users/dto/response/user.short.response.dto';
import { UserGetResponseDto } from '@modules/users/dto/response/user.get.response.dto';
import { UserUpdateStatusRequestDto } from '@modules/users/dto/request/user.update-status.request.dto';
import { UserUpdateProfileRequestDto } from '@modules/users/dto/request/user.update-profile.request.dto';
import { UserUpdatePreferencesRequestDto } from '../dto/request/user.update-preferences.request.dto';
import { UserUpdateSettingsDto } from '../dto/request/user.update-settings.request.dto';
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly helperDateService: HelperDateService,
    private readonly helperStringService: HelperStringService
  ) { }

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
      language: ENUM_MESSAGE_LANGUAGE.EN,
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
    return this.userRepository.findOneById<UserDocument>(id, options);
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

    return this.userRepository.save(repository, options);
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
    return this.userRepository.softDelete(repository, options);
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

    return this.userRepository.save(user, options);
  }

  async resetPasswordAttempt(
    user: UserDocument,
    options?: IDatabaseSaveOptions
  ) {
    user.passwordAttempts = 0;

    return this.userRepository.save(user, options);
  }

  async increasePasswordAttempt(
    user: UserDocument,
    options?: IDatabaseSaveOptions
  ) {
    user.passwordAttempts += 1;

    return this.userRepository.save(user, options);
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

    return this.userRepository.save(repository, options);
  }

  async updateVerificationMobileNumber(
    repository: UserDocument,
    options?: IDatabaseSaveOptions
  ): Promise<UserDocument> {
    repository.verification.mobileNumber = true;
    repository.verification.mobileNumberVerifiedAt =
      this.helperDateService.create();

    return this.userRepository.save(repository, options);
  }

  async updateStatus(
    repository: UserDocument,
    { status }: UserUpdateStatusRequestDto,
    options?: IDatabaseSaveOptions
  ) {
    repository.status = status;

    return this.userRepository.save(repository, options);
  }

  async updateRole(
    repository: UserDocument,
    { role }: { role: ENUM_USER_ROLE },
    options?: IDatabaseSaveOptions
  ) {
    repository.role = role;

    return this.userRepository.save(repository, options);
  }

  async updateProfile(
    repository: UserDocument,
    { lastName, firstName, gender }: UserUpdateProfileRequestDto,
    options?: IDatabaseSaveOptions
  ) {
    repository.lastName = lastName;
    repository.firstName = firstName;
    repository.gender = gender;

    return this.userRepository.save(repository, options);
  }

  async updatePreferences(
    repository: UserDocument,
    { language, theme }: UserUpdatePreferencesRequestDto,
    options?: IDatabaseSaveOptions
  ) {
    repository.preferences.language = language;
    repository.preferences.theme = theme;

    return this.userRepository.save(repository, options);
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

    return this.userRepository.save(repository, options);
  }

  async updateExpoPushToken(
    repository: UserDocument,
    expoPushToken: string,
    options?: IDatabaseSaveOptions
  ) {
    repository.expoPushToken = expoPushToken;

    return this.userRepository.save(repository, options);
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

    return this.userRepository.save(repository, options);
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

    return this.userRepository.save(repository, options);
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
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [long, lat] },
          $maxDistance: radiusInMeters
        }
      },
      'settings.pushEnabled': true,
      'settings.sosAlerts': true
    }, options);
  }

  async getNearbyVolunteer(user: UserDocument, options?: IDatabaseFindAllOptions) {
    return this.findRescuersNearby(user.location.coordinates[1], user.location.coordinates[0], 5000,
      {},
      options);
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
