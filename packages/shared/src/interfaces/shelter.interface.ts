import { ENUM_SHELTER_STATUS, ENUM_SHELTER_TYPE } from "../enums/shelter.enum";

export interface IShelterResource {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  lastUpdated?: Date;
}

export interface IShelterResponse {
  _id: string;
  name: string;
  type: ENUM_SHELTER_TYPE;
  status: ENUM_SHELTER_STATUS;
  location: {
    type: string;
    coordinates: number[];
  };
  address: string;
  regionId: string;
  capacity?: number;
  currentOccupancy?: number;
  resources?: IShelterResource[];
  contactPerson?: string;
  contactPhone?: string;
  description?: string;
  images?: string[];
  facilities?: {
    electricity?: boolean;
    water?: boolean;
    medical?: boolean;
    kitchen?: boolean;
    restroom?: boolean;
    [key: string]: any;
  };
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
