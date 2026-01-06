import { useQuery } from "@tanstack/react-query";
import qs from "qs";
import api from "../axios";

// Types
export interface Court {
  id: string;
  name: string;
  // Add more fields based on your API response
}

export interface CourtFindParams {
  judicial_ids: string[];
  latitude: number;
  longitude: number;
}

export interface Judicial {
  id: string;
  name: string;
  code: number;
}

export interface CourtFindResult {
  id: string;
  name: string;
  address: string;
  phone: string;
  description: string;
  polygon: string;
  judicial: Judicial;
}

// API functions
export const courtsApi = {
  getAll: async (): Promise<Court[]> => {
    const { data } = await api.get("/court/");
    return data;
  },

  getById: async (id: number): Promise<Court> => {
    const { data } = await api.get(`/court/${id}/`);
    return data;
  },

  find: async (params: CourtFindParams): Promise<CourtFindResult[]> => {
    console.log("[courtsApi.find] Calling API with params:", params);
    const queryString = qs.stringify(
      {
        judicial_ids: params.judicial_ids,
        lat: params.latitude,
        lng: params.longitude,
      },
      { arrayFormat: "repeat" }
    );
    const { data } = await api.get(`/court/find?${queryString}`);
    console.log("[courtsApi.find] Response:", data);
    return data;
  },
};

// Query keys
export const courtKeys = {
  all: ["courts"] as const,
  detail: (id: number) => ["courts", id] as const,
  find: (params: CourtFindParams) => [
    "courts",
    "find",
    params.judicial_ids.join(","),
    params.latitude,
    params.longitude,
  ] as const,
};

// React Query hooks
export const useCourts = () => {
  return useQuery({
    queryKey: courtKeys.all,
    queryFn: courtsApi.getAll,
  });
};

export const useCourt = (id: number) => {
  return useQuery({
    queryKey: courtKeys.detail(id),
    queryFn: () => courtsApi.getById(id),
    enabled: !!id,
  });
};

export const useCourtFind = (params: CourtFindParams | null) => {
  console.log("[useCourtFind] Hook called with params:", params);
  console.log("[useCourtFind] Enabled:", !!params && params.judicial_ids.length > 0);
  
  return useQuery({
    queryKey: params ? courtKeys.find(params) : ["courts", "find"],
    queryFn: () => courtsApi.find(params!),
    enabled: !!params && params.judicial_ids.length > 0,
    staleTime: 0,
    gcTime: 0,
  });
};
