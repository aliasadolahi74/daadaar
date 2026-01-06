"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, Scale, Loader2, Phone, FileText, Building, ChevronUp, ChevronDown, Navigation } from "lucide-react";
import Map from "src/features/Map";
import { useCourtFind, CourtFindResult } from "@/src/lib/api/courts";
import { cn } from "@/src/lib/utils";
import { toPersianDigits } from "@/src/lib/persian-numbers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "core/components/ui/dialog";
import { Button } from "core/components/ui/button";

// Azadi Square coordinates (fallback)
const AZADI_SQUARE: [number, number] = [51.3380, 35.6997];
const GPS_PROMPT_KEY = "gps_prompt_dismissed";

function DistrictsContent() {
  const searchParams = useSearchParams();
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [initialCenter, setInitialCenter] = useState<[number, number]>(AZADI_SQUARE);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [focusPolygonId, setFocusPolygonId] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<CourtFindResult | null>(null);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [showGpsPrompt, setShowGpsPrompt] = useState(false);

  // Parse court IDs from query params (UUIDs)
  const courtsParam = searchParams.get("courts");
  const judicialIds = courtsParam
    ? courtsParam.split(",").filter((id) => id.trim().length > 0)
    : [];

  // Check if GPS prompt was dismissed and show it if not
  useEffect(() => {
    const dismissed = sessionStorage.getItem(GPS_PROMPT_KEY);
    if (!dismissed) {
      setShowGpsPrompt(true);
    } else {
      // User already made a choice, proceed with their preference
      if (dismissed === "allowed") {
        requestGeolocation();
      } else {
        setMapCenter(AZADI_SQUARE);
        setIsLoadingLocation(false);
      }
    }
  }, []);

  const requestGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setInitialCenter(coords);
          setMapCenter(coords);
          setIsLoadingLocation(false);
        },
        () => {
          setMapCenter(AZADI_SQUARE);
          setIsLoadingLocation(false);
        }
      );
    } else {
      setMapCenter(AZADI_SQUARE);
      setIsLoadingLocation(false);
    }
  };

  const handleAllowGps = () => {
    sessionStorage.setItem(GPS_PROMPT_KEY, "allowed");
    setShowGpsPrompt(false);
    requestGeolocation();
  };

  const handleDenyGps = () => {
    sessionStorage.setItem(GPS_PROMPT_KEY, "denied");
    setShowGpsPrompt(false);
    setMapCenter(AZADI_SQUARE);
    setIsLoadingLocation(false);
  };

  const handleCenterChange = useCallback((lng: number, lat: number) => {
    setMapCenter([lng, lat]);
  }, []);

  // Call court find API
  const { data: courts, isLoading, error } = useCourtFind(
    mapCenter && judicialIds.length > 0
      ? {
          judicial_ids: judicialIds,
          latitude: mapCenter[1],
          longitude: mapCenter[0],
        }
      : null
  );

  // Prepare polygons for map
  const polygons = courts?.map((court) => ({
    id: court.id,
    polygon: court.polygon,
    name: court.name,
  })) || [];

  const handleCourtClick = (court: CourtFindResult) => {
    setFocusPolygonId(court.id);
    setSelectedCourt(court);
    setIsBottomSheetExpanded(false);
  };

  const renderResults = () => {
    if (isLoadingLocation) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>در حال دریافت موقعیت...</p>
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>در حال بارگذاری...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center">
          <p>خطا در دریافت اطلاعات</p>
        </div>
      );
    }
    
    if (courts && courts.length > 0) {
      return (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            {toPersianDigits(courts.length)} نتیجه یافت شد
          </p>
          <ul className="space-y-3">
            {courts.map((court) => (
              <li
                key={court.id}
                className={cn(
                  "p-4 rounded-xl border border-border/50 bg-card cursor-pointer transition-all duration-200",
                  "hover:border-primary/50 hover:shadow-md md:hover:-translate-y-0.5",
                  focusPolygonId === court.id && "border-primary bg-primary/5 shadow-md"
                )}
                onClick={() => handleCourtClick(court)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{court.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{court.judicial.name}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <MapPin className="h-12 w-12 mb-3 opacity-30" />
        <p>نتیجه‌ای یافت نشد</p>
        <p className="text-sm mt-1">نقشه را جابجا کنید</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-80 h-full bg-gradient-to-b from-background to-secondary/20 border-l border-border shadow-lg flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="دادار" width={40} height={40} />
            <div>
              <h1 className="text-xl font-bold text-primary">دادار</h1>
              <p className="text-xs text-muted-foreground">سامانه یافتن حوزه قضایی</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">نتایج جستجو</h2>
          </div>
          {renderResults()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-secondary/30">
          <p className="text-xs text-muted-foreground text-center">
            © {toPersianDigits(1404)} دادار - تمامی حقوق محفوظ است
          </p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="دادار" width={28} height={28} />
          <span className="font-bold text-primary">دادار</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <Map
          center={initialCenter}
          zoom={14}
          onCenterChange={handleCenterChange}
          polygons={polygons}
          focusPolygonId={focusPolygonId}
        />
      </div>

      {/* Mobile Bottom Sheet */}
      <div
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl border-t border-border transition-all duration-300 z-20",
          isBottomSheetExpanded ? "h-[70vh]" : "h-auto"
        )}
      >
        {/* Handle */}
        <button
          onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
          className="w-full flex flex-col items-center pt-3 pb-2"
        >
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mb-2" />
          <div className="flex items-center gap-2 text-muted-foreground">
            {isBottomSheetExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
            <span className="text-sm">
              {courts && courts.length > 0
                ? `${toPersianDigits(courts.length)} نتیجه`
                : "نتایج جستجو"}
            </span>
          </div>
        </button>

        {/* Content */}
        <div
          className={cn(
            "px-4 pb-6 overflow-y-auto transition-all duration-300",
            isBottomSheetExpanded ? "max-h-[calc(70vh-60px)]" : "max-h-0 overflow-hidden"
          )}
        >
          {renderResults()}
        </div>
      </div>

      {/* Court Details Dialog */}
      <Dialog open={!!selectedCourt} onOpenChange={(open) => !open && setSelectedCourt(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 ps-8">
              <Building className="h-5 w-5 text-primary shrink-0" />
              <span>{selectedCourt ? toPersianDigits(selectedCourt.name) : ""}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedCourt && (
            <div className="space-y-4 mt-4">
              {/* Judicial Info */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Scale className="h-4 w-4" />
                  <span className="font-medium">نوع دادگاه</span>
                </div>
                <p className="text-foreground">{selectedCourt.judicial.name}</p>
                <p className="text-sm text-muted-foreground">کد: {toPersianDigits(selectedCourt.judicial.code)}</p>
              </div>

              {/* Address */}
              {selectedCourt.address && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">آدرس</span>
                  </div>
                  <p className="text-foreground">{selectedCourt.address}</p>
                </div>
              )}

              {/* Phone */}
              {selectedCourt.phone && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">تلفن</span>
                  </div>
                  <p className="text-foreground">{toPersianDigits(selectedCourt.phone)}</p>
                </div>
              )}

              {/* Description */}
              {selectedCourt.description && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">توضیحات</span>
                  </div>
                  <p className="text-foreground">{selectedCourt.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* GPS Permission Prompt */}
      <Dialog open={showGpsPrompt} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Navigation className="h-6 w-6 text-primary" />
              <span>دسترسی به موقعیت</span>
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              برای نمایش دقیق‌تر نتایج، اجازه دسترسی به موقعیت مکانی خود را بدهید.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleAllowGps} className="flex-1">
              اجازه می‌دهم
            </Button>
            <Button onClick={handleDenyGps} variant="outline" className="flex-1">
              بعداً
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
