"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Map from "src/features/Map";
import Sidebar from "src/features/Sidebar";
import { useCourtFind } from "@/src/lib/api/courts";

// Azadi Square coordinates (fallback)
const AZADI_SQUARE: [number, number] = [51.3380, 35.6997];

function DistrictsContent() {
  const searchParams = useSearchParams();
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [focusPolygonId, setFocusPolygonId] = useState<string | null>(null);

  // Parse court IDs from query params (UUIDs)
  const courtsParam = searchParams.get("courts");
  const judicialIds = courtsParam
    ? courtsParam.split(",").filter((id) => id.trim().length > 0)
    : [];

  console.log("[DistrictsContent] courtsParam:", courtsParam);
  console.log("[DistrictsContent] judicialIds:", judicialIds);
  console.log("[DistrictsContent] markerPosition:", markerPosition);

  // Get user geolocation or fallback to Azadi Square
  useEffect(() => {
    console.log("[DistrictsContent] Getting geolocation...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[DistrictsContent] Geolocation success:", position.coords);
          setMarkerPosition([position.coords.longitude, position.coords.latitude]);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.log("[DistrictsContent] Geolocation error, using Azadi Square:", error);
          setMarkerPosition(AZADI_SQUARE);
          setIsLoadingLocation(false);
        }
      );
    } else {
      console.log("[DistrictsContent] No geolocation support, using Azadi Square");
      setMarkerPosition(AZADI_SQUARE);
      setIsLoadingLocation(false);
    }
  }, []);

  const handleMarkerChange = useCallback((lng: number, lat: number) => {
    console.log("[DistrictsContent] Marker changed:", { lng, lat });
    setMarkerPosition([lng, lat]);
  }, []);

  // Call court find API
  const { data: courts, isLoading, error } = useCourtFind(
    markerPosition && judicialIds.length > 0
      ? {
          judicial_ids: judicialIds,
          latitude: markerPosition[1],
          longitude: markerPosition[0],
        }
      : null
  );

  // Prepare polygons for map
  const polygons = courts?.map((court) => ({
    id: court.id,
    polygon: court.polygon,
    name: court.name,
  })) || [];

  return (
    <div className="flex h-screen w-screen">
      <Sidebar>
        <h2 className="text-lg font-semibold mb-4">نتایج جستجو</h2>
        {isLoadingLocation ? (
          <p className="text-muted-foreground">در حال دریافت موقعیت...</p>
        ) : isLoading ? (
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        ) : error ? (
          <p className="text-destructive">خطا در دریافت اطلاعات</p>
        ) : courts && courts.length > 0 ? (
          <ul className="space-y-2">
            {courts.map((court) => (
              <li
                key={court.id}
                className="p-2 rounded-md bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => setFocusPolygonId(court.id)}
              >
                <div className="font-medium">{court.name}</div>
                <div className="text-sm text-muted-foreground">{court.judicial.name}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">نتیجه‌ای یافت نشد</p>
        )}
      </Sidebar>
      <div className="flex-1 relative">
        <Map
          center={AZADI_SQUARE}
          zoom={11}
          markerPosition={markerPosition ?? undefined}
          onMarkerChange={handleMarkerChange}
          polygons={polygons}
          focusPolygonId={focusPolygonId}
        />
      </div>
    </div>
  );
}

export default function DistrictsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center">در حال بارگذاری...</div>}>
      <DistrictsContent />
    </Suspense>
  );
}
