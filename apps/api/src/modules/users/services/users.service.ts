import { Injectable, NotFoundException } from '@nestjs/common';
import { Document } from 'mongoose';

import { UserDocument, UserEntity } from '@modules/users/repository/entities/user.entity';

import { UserCreateRequestDto } from '@modules/users/dto/request/user.create.request.dto';
import { UserUpdateRequestDto } from '@modules/users/dto/request/user.update.request.dto';

import { IAuthPassword } from '@modules/auth/interfaces/auth.interface';
import { IDatabaseCreateOptions, IDatabaseDeleteManyOptions, IDatabaseExistsOptions, IDatabaseFindAllOptions, IDatabaseFindOneOptions, IDatabaseGetTotalOptions, IDatabaseSaveOptions, IDatabaseSoftDeleteOptions } from '@common/database/interfaces/database.interface';
import { UserRepository } from '@modules/users/repository/repositories/user.repository';
import { DatabaseHelperQueryContain } from '@common/database/decorators/database.decorator';
import { ENUM_USER_SIGN_UP_FROM, ENUM_USER_STATUS } from '@repo/shared';
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
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly helperDateService: HelperDateService,
    private readonly helperStringService: HelperStringService
  ) { }

  async create(
    { email, password, firstName, lastName }: UserCreateRequestDto,
    { passwordCreated, passwordExpired, passwordHash}: IAuthPassword,
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
    return this.userRepository.create<UserEntity>(newUser, options);
  }

  async findAll(
    find: Record<string, any>, 
    options?: IDatabaseFindAllOptions
  ) {
    return this.userRepository.findAll<UserDocument>(find, options);
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

async update(respository: UserDocument, updateUserDto: UserUpdateRequestDto, options?: IDatabaseSaveOptions) {
    respository.firstName = updateUserDto.firstName;
    respository.lastName = updateUserDto.lastName;
    respository.gender = updateUserDto.gender;

    return this.userRepository.save(respository, options);
  }

  async remove(id: string) {
    const user = await this.userRepository.delete({ _id: id });
    if (!user) {
      return new NotFoundException('User not found');
    }
    return user;
  }

  async softDelete(
    repository: UserDocument,
    options?: IDatabaseSoftDeleteOptions
  ): Promise<UserDocument> {
    return this.userRepository.softDelete(repository, options);
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


  async signUp(
    data: IAuthPassword, 
    { email, firstName, lastName }: { email: string, lastName: string, firstName: string }, 
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
}
