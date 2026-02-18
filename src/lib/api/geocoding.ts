import axios from "axios";
import { useQuery } from "@tanstack/react-query";

// Types
export interface GeocodingExtent {
  southWest: {
    latitude: number;
    longitude: number;
  };
  northEast: {
    latitude: number;
    longitude: number;
  };
}

export interface GeocodingParams {
  address: string;
  extent?: GeocodingExtent;
}

export interface GeocodingLocation {
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  location: GeocodingLocation;
  province: string;
  city: string;
  neighbourhood: string;
  unMatchedTerm: string;
}

export interface GeocodingResponse {
  items: GeocodingResult[];
}

// Neshan API client
const neshanApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NESHAN_API_URL || "https://api.neshan.org/geocoding/v1",
  headers: {
    "Api-Key": process.env.NEXT_PUBLIC_NESHAN_API_KEY || "",
  },
});

// API functions
export const geocodingApi = {
  search: async (params: GeocodingParams): Promise<GeocodingResponse> => {
    const requestBody: any = {
      address: params.address,
    };

    if (params.extent) {
      requestBody.extent = params.extent;
    }

    const { data } = await neshanApi.get("", {
      params: {
        json: JSON.stringify(requestBody),
      },
    });
    return data;
  },
};

// Query keys
export const geocodingKeys = {
  search: (params: GeocodingParams) => ["geocoding", "search", params.address, params.extent] as const,
};

// React Query hook
export const useGeocoding = (params: GeocodingParams | null) => {
  return useQuery({
    queryKey: params ? geocodingKeys.search(params) : ["geocoding", "search"],
    queryFn: () => geocodingApi.search(params!),
    enabled: !!params && params.address.trim().length > 2,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000,
  });
};
