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
      `/admin/shelter/nearby/search?lat=${lat}&lng=${lng}&maxDistance=${maxDistance}`
    );
  },

  getAllShelters: async (): Promise<Shelter[]> => {
    const res = await apiService.get<any>(
      `/admin/shelter/list?limit=1000`
    );
    // Flexible extraction to handle various response wrappers (ResponsePaging vs standard)
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  },

  getShelterDetail: async (id: string): Promise<Shelter> => {
    return apiService.get<Shelter>(`/admin/shelter/${id}`);
  },
};
