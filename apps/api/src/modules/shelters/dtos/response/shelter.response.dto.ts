export class ShelterListResponseDto {
  _id: string;
  name: string;
  type: string;
  status: string;
  location: {
    type: string;
    coordinates: number[];
  };
  address: string;
  regionId: string;
  capacity?: number;
  currentOccupancy?: number;
  contactPerson?: string;
  contactPhone?: string;
  description?: string;
  facilities?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  distance?: number; // For nearby queries
}

export class ShelterDetailResponseDto extends ShelterListResponseDto {
  resources?: Array<{
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    lastUpdated?: Date;
  }>;
  images?: string[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
