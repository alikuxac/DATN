import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ShelterRepository } from '../repository/repositories/shelter.repository';
import { ShelterEntity, ShelterDocument } from '../repository/entities/shelter.entity';
import { ShelterCreateRequestDto } from '../dtos/request/shelter.create.request.dto';
import { ShelterUpdateRequestDto } from '../dtos/request/shelter.update.request.dto';

import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { Types } from 'mongoose';
import { IDatabaseFindAllOptions } from '@common/database/interfaces/database.interface';
import { ENUM_SHELTER_STATUS, IShelterResponse } from '@repo/shared';

@Injectable()
export class ShelterService {
  constructor(
    private readonly shelterRepository: ShelterRepository
  ) { }

  async create(
    user: UserDocument,
    dto: ShelterCreateRequestDto
  ): Promise<ShelterDocument> {
    const shelter = await this.shelterRepository.create({
      ...dto,
      createdBy: user._id.toString(),
      status: ENUM_SHELTER_STATUS.ACTIVE,
    } as unknown as ShelterEntity);

    return shelter;
  }

  async findAll(
    find?: Record<string, any>,
    options?: IDatabaseFindAllOptions
  ): Promise<ShelterDocument[]> {
    const query = { ...find, deletedAt: null };
    return this.shelterRepository.findAll(query, options);
  }

  async findOneById(id: string): Promise<ShelterDocument> {
    const shelter = await this.shelterRepository.findOneById(id, {
      join: {
        path: 'createdBy',
        select: 'firstName lastName email'
      }
    });

    if (!shelter || shelter.deletedAt) {
      throw new NotFoundException('shelter.error.notFound');
    }

    return shelter;
  }

  async findNearby(
    lat: number,
    lng: number,
    maxDistance: number = 10000,
    filters?: Record<string, any>
  ): Promise<ShelterDocument[]> {
    return this.shelterRepository.findNearby(lat, lng, maxDistance, filters);
  }

  async update(
    id: string,
    dto: ShelterUpdateRequestDto
  ): Promise<ShelterDocument> {
    const shelter = await this.findOneById(id);

    const updated = await this.shelterRepository.updateRaw(
      { _id: shelter._id },
      { $set: dto }
    );

    if (!updated) {
      throw new BadRequestException('shelter.error.updateFailed');
    }

    return updated;
  }

  async updateResources(
    id: string,
    resources: Array<{ name: string; quantity: number; unit: string; category?: string }>
  ): Promise<ShelterDocument> {
    const shelter = await this.findOneById(id);

    const updatedResources = resources.map(r => ({
      ...r,
      lastUpdated: new Date()
    }));

    const updated = await this.shelterRepository.updateRaw(
      { _id: shelter._id },
      { $set: { resources: updatedResources } }
    );

    if (!updated) {
      throw new BadRequestException('shelter.error.updateResourcesFailed');
    }

    return updated;
  }

  async updateOccupancy(
    id: string,
    currentOccupancy: number
  ): Promise<ShelterDocument> {
    const shelter = await this.findOneById(id);

    if (shelter.capacity && currentOccupancy > shelter.capacity) {
      throw new BadRequestException('shelter.error.exceedsCapacity');
    }

    const status = shelter.capacity && currentOccupancy >= shelter.capacity
      ? ENUM_SHELTER_STATUS.FULL
      : ENUM_SHELTER_STATUS.ACTIVE;

    const updated = await this.shelterRepository.updateRaw(
      { _id: shelter._id },
      { $set: { currentOccupancy, status } }
    );

    if (!updated) {
      throw new BadRequestException('shelter.error.updateOccupancyFailed');
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const shelter = await this.findOneById(id);

    await this.shelterRepository.softDelete(shelter);

    return true;
  }

  async getTotal(find?: Record<string, any>): Promise<number> {
    const query = { ...find, deletedAt: null };
    return this.shelterRepository.getTotal(query);
  }

  mapToResponse(shelter: ShelterDocument): IShelterResponse {
    return {
      _id: shelter._id.toString(),
      name: shelter.name,
      type: shelter.type,
      status: shelter.status,
      location: shelter.location,
      address: shelter.address,
      regionId: shelter.regionId,
      capacity: shelter.capacity,
      currentOccupancy: shelter.currentOccupancy,
      resources: shelter.resources,
      contactPerson: shelter.contactPerson,
      contactPhone: shelter.contactPhone,
      description: shelter.description,
      images: shelter.images,
      facilities: shelter.facilities,
      createdBy: (shelter as any).createdBy ? {
        _id: (shelter as any).createdBy._id?.toString(),
        firstName: (shelter as any).createdBy.firstName,
        lastName: (shelter as any).createdBy.lastName,
        email: (shelter as any).createdBy.email
      } : undefined,
      createdAt: shelter.createdAt,
      updatedAt: shelter.updatedAt
    };
  }
}
