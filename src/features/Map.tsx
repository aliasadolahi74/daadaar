"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Search } from "lucide-react";

export interface PolygonData {
  id: string;
  polygon: string;
  name: string;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  onCenterChange?: (lng: number, lat: number) => void;
  polygons?: PolygonData[];
  focusPolygonId?: string | null;
}

// Parse WKT polygon string to GeoJSON coordinates
function parseWKTPolygon(wkt: string): number[][][] | null {
  const match = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
  if (!match) return null;

  const coordsStr = match[1];
  const coords = coordsStr.split(",").map((pair) => {
    const [lng, lat] = pair.trim().split(/\s+/).map(Number);
    return [lng, lat];
  });

  return [coords];
}

// Get bounds from polygon coordinates
function getBoundsFromCoords(coords: number[][][]): maplibregl.LngLatBoundsLike {
  const points = coords[0];
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  points.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return [[minLng, minLat], [maxLng, maxLat]];
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

const POLYGONS_SOURCE_ID = "polygons-source";
const POLYGONS_FILL_LAYER = "polygons-fill";
const POLYGONS_OUTLINE_LAYER = "polygons-outline";

export default function Map({
  center = [51.389, 35.6892],
  zoom = 11,
  className,
  style,
  onCenterChange,
  polygons = [],
  focusPolygonId,
}: MapProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onCenterChangeRef = useRef(onCenterChange);
  const isProgrammaticMoveRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange;
  }, [onCenterChange]);

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearch) {
      console.log("[Map] Search query:", debouncedSearch);
      // TODO: Implement geocoding search here
    }
  }, [debouncedSearch]);

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && !mapRef.current) {
        const map = new maplibregl.Map({
          container: node,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              },
            },
            layers: [{ id: "osm", type: "raster", source: "osm" }],
          },
          center,
          zoom,
        });

        map.addControl(new maplibregl.NavigationControl(), "top-left");

        // Emit center on map move end (only for user interactions)
        map.on("moveend", () => {
          if (isProgrammaticMoveRef.current) {
            isProgrammaticMoveRef.current = false;
            return;
          }
          const mapCenter = map.getCenter();
          if (onCenterChangeRef.current) {
            onCenterChangeRef.current(mapCenter.lng, mapCenter.lat);
          }
        });

        // Initial center emit
        map.on("load", () => {
          const mapCenter = map.getCenter();
          if (onCenterChangeRef.current) {
            onCenterChangeRef.current(mapCenter.lng, mapCenter.lat);
          }
        });

        mapRef.current = map;
      }
    },
    [center, zoom]
  );

  // Handle polygons - single source with FeatureCollection
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updatePolygons = () => {
      const features = polygons
        .map((item, index) => {
          const coordinates = parseWKTPolygon(item.polygon);
          if (!coordinates) return null;
          return {
            type: "Feature" as const,
            properties: { name: item.name, colorIndex: index % 6 },
            geometry: { type: "Polygon" as const, coordinates },
          };
        })
        .filter(Boolean);

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: features as GeoJSON.Feature[],
      };

      const source = map.getSource(POLYGONS_SOURCE_ID) as maplibregl.GeoJSONSource;

      if (source) {
        source.setData(geojson);
      } else {
        map.addSource(POLYGONS_SOURCE_ID, { type: "geojson", data: geojson });

        map.addLayer({
          id: POLYGONS_FILL_LAYER,
          type: "fill",
          source: POLYGONS_SOURCE_ID,
          paint: {
            "fill-color": [
              "match", ["get", "colorIndex"],
              0, "hsl(210, 70%, 50%)",
              1, "hsl(270, 70%, 50%)",
              2, "hsl(330, 70%, 50%)",
              3, "hsl(30, 70%, 50%)",
              4, "hsl(90, 70%, 50%)",
              5, "hsl(150, 70%, 50%)",
              "hsl(210, 70%, 50%)",
            ],
            "fill-opacity": 0.3,
          },
        });

        map.addLayer({
          id: POLYGONS_OUTLINE_LAYER,
          type: "line",
          source: POLYGONS_SOURCE_ID,
          paint: {
            "line-color": [
              "match", ["get", "colorIndex"],
              0, "hsl(210, 70%, 40%)",
              1, "hsl(270, 70%, 40%)",
              2, "hsl(330, 70%, 40%)",
              3, "hsl(30, 70%, 40%)",
              4, "hsl(90, 70%, 40%)",
              5, "hsl(150, 70%, 40%)",
              "hsl(210, 70%, 40%)",
            ],
            "line-width": 2,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      updatePolygons();
    } else {
      map.on("load", updatePolygons);
    }
  }, [polygons]);

  // Focus on specific polygon
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusPolygonId) return;

    const polygon = polygons.find((p) => p.id === focusPolygonId);
    if (!polygon) return;

    const coords = parseWKTPolygon(polygon.polygon);
    if (!coords) return;

    const bounds = getBoundsFromCoords(coords);
    isProgrammaticMoveRef.current = true;
    map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
  }, [focusPolygonId, polygons]);

  return (
    <div 
      className={className} 
      style={{ 
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        ...style 
      }}
    >
      {/* Search bar */}
      <div className="absolute top-4 right-4 left-14 md:left-4 z-10">
        <div className="relative max-w-md ms-auto md:mx-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="جستجوی مکان‌ها"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pr-10 pl-4 rounded-lg border border-input bg-background shadow-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Center marker (fixed in middle) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" fill="hsl(217, 91%, 50%)" />
          <circle cx="16" cy="16" r="6" fill="white" />
        </svg>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
