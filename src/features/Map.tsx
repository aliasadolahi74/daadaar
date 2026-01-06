"use client";

import { useCallback, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

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
  markerPosition?: [number, number];
  onMarkerChange?: (lng: number, lat: number) => void;
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

const POLYGONS_SOURCE_ID = "polygons-source";
const POLYGONS_FILL_LAYER = "polygons-fill";
const POLYGONS_OUTLINE_LAYER = "polygons-outline";

export default function Map({
  center = [51.389, 35.6892],
  zoom = 11,
  className,
  style,
  markerPosition,
  onMarkerChange,
  polygons = [],
  focusPolygonId,
}: MapProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onMarkerChangeRef = useRef(onMarkerChange);

  useEffect(() => {
    onMarkerChangeRef.current = onMarkerChange;
  }, [onMarkerChange]);

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

        map.addControl(new maplibregl.NavigationControl(), "top-right");
        mapRef.current = map;
      }
    },
    [center, zoom]
  );

  // Handle marker
  useEffect(() => {
    if (!mapRef.current || !markerPosition) return;

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ draggable: true })
        .setLngLat(markerPosition)
        .addTo(mapRef.current);

      markerRef.current.on("dragend", () => {
        const lngLat = markerRef.current?.getLngLat();
        if (lngLat && onMarkerChangeRef.current) {
          onMarkerChangeRef.current(lngLat.lng, lngLat.lat);
        }
      });
    } else {
      markerRef.current.setLngLat(markerPosition);
    }

    mapRef.current.flyTo({ center: markerPosition, zoom: 14 });
  }, [markerPosition]);

  // Handle polygons - single source with FeatureCollection
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updatePolygons = () => {
      // Build GeoJSON FeatureCollection
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
    map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
  }, [focusPolygonId, polygons]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  );
}
