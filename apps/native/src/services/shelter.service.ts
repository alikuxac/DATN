import { apiService } from "./api.service";

export interface Shelter {
  _id: string;
  name: string;
  type: string;
  status: string;
  address: string;
  location: {
    type: string;
    coordinates: number[]; // [lng, lat]
  };
  capacity?: number;
  currentOccupancy?: number;
  contactPerson?: string;
  contactPhone?: string;
  description?: string;
  distance?: number;
  facilities?: {
    electricity?: boolean;
    water?: boolean;
    medical?: boolean;
    kitchen?: boolean;
    restroom?: boolean;
  };
}

export const shelterService = {
  getNearbyShelters: async (
    lat: number,
    lng: number,
    maxDistance: number = 10000 // 10km
  ): Promise<Shelter[]> => {
    return apiService.get<Shelter[]>(
      `/shelter/nearby/search?lat=${lat}&lng=${lng}&maxDistance=${maxDistance}`
    );
  },

  getShelterDetail: async (id: string): Promise<Shelter> => {
    return apiService.get<Shelter>(`/shelter/${id}`);
  },
};
