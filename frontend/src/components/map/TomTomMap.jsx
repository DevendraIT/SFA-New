import React, { useEffect, useRef, useState, useCallback } from "react";
import tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { MapPin, Navigation, AlertTriangle, Loader2 } from "lucide-react";

/**
 * Enterprise Navigation Configuration Constants
 */
export const ARRIVAL_RADIUS_METERS = 30;
export const ROUTE_DEVIATION_METERS = 75;
export const GPS_RECALCULATION_DISTANCE = 20;
export const GPS_RECALCULATION_TIME_MS = 10000;
export const MAX_GPS_ACCURACY_THRESHOLD = 50;
export const ROUTING_API_TIMEOUT_MS = 10000;

/**
 * Validates whether a pair of coordinates are valid finite non-zero numbers.
 */
function isValidCoord(lat, lng) {
  if (lat == null || lng == null || lat === "" || lng === "") return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    !isNaN(nLat) &&
    isFinite(nLat) &&
    nLat !== 0 &&
    nLat >= -90 &&
    nLat <= 90 &&
    !isNaN(nLng) &&
    isFinite(nLng) &&
    nLng !== 0 &&
    nLng >= -180 &&
    nLng <= 180
  );
}

/**
 * Haversine formula to compute distance in meters between two lat/lng pairs.
 */
function calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Distance from point P to line segment AB in meters.
 */
function distanceToSegmentMeters(pLat, pLng, aLat, aLng, bLat, bLng) {
  const dAB = calculateHaversineDistanceMeters(aLat, aLng, bLat, bLng);
  if (dAB === 0) return calculateHaversineDistanceMeters(pLat, pLng, aLat, aLng);
  const dAP = calculateHaversineDistanceMeters(aLat, aLng, pLat, pLng);
  const dBP = calculateHaversineDistanceMeters(bLat, bLng, pLat, pLng);
  return Math.min(dAP, dBP);
}

/**
 * Calculates shortest distance in meters from executive position to polyline points.
 */
function calculateMinDistanceToPolylineMeters(execLat, execLng, polylinePoints) {
  if (!polylinePoints || polylinePoints.length === 0) return 0;
  let minDistance = Infinity;

  for (let i = 0; i < polylinePoints.length - 1; i++) {
    const ptA = polylinePoints[i];
    const ptB = polylinePoints[i + 1];
    const dist = distanceToSegmentMeters(
      execLat,
      execLng,
      ptA.latitude,
      ptA.longitude,
      ptB.latitude,
      ptB.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance === Infinity ? 0 : Math.round(minDistance);
}

/**
 * Smoothly interpolates marker position using requestAnimationFrame over durationMs.
 */
function animateMarkerToNewPosition(marker, startPos, endPos, durationMs = 600) {
  if (!marker || !startPos || !endPos) return;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const easeProgress = progress * (2 - progress);

    const currentLat = startPos.lat + (endPos.lat - startPos.lat) * easeProgress;
    const currentLng = startPos.lng + (endPos.lng - startPos.lng) * easeProgress;

    marker.setLngLat([currentLng, currentLat]);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

/**
 * Helper to create application-styled DOM marker elements.
 */
function createCustomMarkerElement(type) {
  const el = document.createElement("div");
  el.className = "relative flex items-center justify-center cursor-pointer group";

  if (type === "pickup") {
    el.innerHTML = `
      <div class="h-8 w-8 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-white transform hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    `;
  } else if (type === "destination") {
    el.innerHTML = `
      <div class="h-8 w-8 rounded-full bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center text-white transform hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    `;
  } else if (type === "executive") {
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <div class="h-6 w-6 rounded-full bg-blue-500 opacity-75 animate-ping absolute"></div>
        <div class="h-8 w-8 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white relative z-10 transition-transform duration-300 ease-out">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </div>
      </div>
    `;
  }

  return el;
}

/**
 * Reusable Enterprise TomTom Map Component
 * Final Phase: Production Hardened Navigation, Map Actions & Offline Resilience
 */
export default function TomTomMap({
  pickup,
  destination,
  currentLocation,
  showCurrentLocation = true,
  navState = "IDLE",
  simulatedPos = null,
  recalculateTrigger = 0,
  mapAction = null,
  height = "400px",
  className = "",
  onMapLoad,
  onRouteCalculated,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const execMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastCalcPosRef = useRef(null);
  const lastCalcTimeRef = useRef(0);
  const isCalculatingRouteRef = useRef(false);
  const activePolylinePointsRef = useRef([]);

  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [gpsWarning, setGpsWarning] = useState(null);
  const [executivePos, setExecutivePos] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY || "5ktu4mke83wVGAUHgm3SZpBqKqbzZHNX";

  const pLat = pickup?.latitude;
  const pLng = pickup?.longitude;
  const pAddr = pickup?.address;
  const dLat = destination?.latitude;
  const dLng = destination?.longitude;
  const dAddr = destination?.address;

  const activeELat = simulatedPos?.latitude ?? executivePos?.lat ?? currentLocation?.latitude ?? currentLocation?.lat;
  const activeELng = simulatedPos?.longitude ?? executivePos?.lng ?? currentLocation?.longitude ?? currentLocation?.lng;

  // Immediate high-accuracy GPS lookup on mount
  useEffect(() => {
    if (navigator.geolocation && !executivePos && !simulatedPos) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setExecutivePos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn("Immediate GPS lookup warning:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [executivePos, simulatedPos]);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const onMapLoadRef = useRef(onMapLoad);

  useEffect(() => {
    onRouteCalculatedRef.current = onRouteCalculated;
    onMapLoadRef.current = onMapLoad;
  });

  // Connection Monitoring (navigator.onLine)
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      onRouteCalculatedRef.current?.({ isOffline: false });
    };
    const handleOffline = () => {
      setIsOffline(true);
      onRouteCalculatedRef.current?.({ isOffline: true, gpsStatus: "OFFLINE" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Real Live GPS Tracking via navigator.geolocation.watchPosition()
  useEffect(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (simulatedPos) {
      onRouteCalculatedRef.current?.({ gpsStatus: "TRACKING" });
      return;
    }

    if (isOffline) {
      setGpsWarning("Offline Mode - Preserving Route");
      onRouteCalculatedRef.current?.({ gpsStatus: "OFFLINE", isOffline: true });
      return;
    }

    if (!("geolocation" in navigator)) {
      setGpsWarning("Browser geolocation not supported.");
      onRouteCalculatedRef.current?.({ gpsStatus: "UNAVAILABLE" });
      return;
    }

    onRouteCalculatedRef.current?.({ gpsStatus: "WAITING" });

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };
        const currentSpeedKmh = speed ? Math.round(speed * 3.6) : 0;

        // Check GPS Accuracy Threshold (50m)
        if (accuracy && accuracy > MAX_GPS_ACCURACY_THRESHOLD) {
          setGpsWarning("GPS Accuracy Low - Waiting for Better GPS...");
          onRouteCalculatedRef.current?.({
            gpsStatus: "ACCURACY_LOW",
            gpsAccuracy: Math.round(accuracy),
            currentSpeedKmh,
          });
          return;
        }

        setGpsWarning(null);

        // Smoothly interpolate Executive Marker position using requestAnimationFrame
        if (execMarkerRef.current) {
          const currentLngLat = execMarkerRef.current.getLngLat();
          const prevPos = { lat: currentLngLat.lat, lng: currentLngLat.lng };
          animateMarkerToNewPosition(execMarkerRef.current, prevPos, newPos, 600);

          // Apply Heading Rotation if present
          if (heading != null && !isNaN(heading)) {
            const iconDiv = execMarkerRef.current.getElement()?.querySelector(".z-10");
            if (iconDiv) iconDiv.style.transform = `rotate(${heading}deg)`;
          }
        }

        setExecutivePos(newPos);

        // 1. Arrival Detection (Within ARRIVAL_RADIUS_METERS = 30m)
        const dLat = destination?.latitude;
        const dLng = destination?.longitude;
        if (isValidCoord(dLat, dLng)) {
          const distToDest = calculateHaversineDistanceMeters(latitude, longitude, dLat, dLng);
          if (distToDest <= ARRIVAL_RADIUS_METERS) {
            onRouteCalculatedRef.current?.({
              gpsStatus: "TRACKING",
              navStatus: "ARRIVED",
              distanceToDestination: Math.round(distToDest),
              gpsAccuracy: Math.round(accuracy || 10),
              currentSpeedKmh,
            });
            return;
          }
        }

        // 2. Route Deviation Detection (Beyond ROUTE_DEVIATION_METERS = 75m)
        let distanceOffRoute = 0;
        if (activePolylinePointsRef.current.length > 0) {
          distanceOffRoute = calculateMinDistanceToPolylineMeters(
            latitude,
            longitude,
            activePolylinePointsRef.current
          );
        }

        const isDeviated = distanceOffRoute > ROUTE_DEVIATION_METERS;

        // Health Score calculation
        let healthScore = 100;
        if (distanceOffRoute <= 10) healthScore = 100;
        else if (distanceOffRoute <= 30) healthScore = 95;
        else if (distanceOffRoute <= 50) healthScore = 80;
        else if (distanceOffRoute <= 75) healthScore = 65;
        else healthScore = Math.max(10, Math.round(100 - distanceOffRoute / 1.5));

        onRouteCalculatedRef.current?.({
          gpsStatus: "TRACKING",
          navStatus: isDeviated ? "DEVIATED" : "NAVIGATING",
          distanceOffRoute,
          healthScore,
          gpsAccuracy: Math.round(accuracy || 10),
          currentSpeedKmh,
        });

        // 3. Throttled Route Recalculation (>20m OR >10s)
        const now = Date.now();
        const distMoved = lastCalcPosRef.current
          ? calculateHaversineDistanceMeters(
              lastCalcPosRef.current.lat,
              lastCalcPosRef.current.lng,
              latitude,
              longitude
            )
          : Infinity;

        const timeElapsed = now - lastCalcTimeRef.current;

        if (!isDeviated && (distMoved > GPS_RECALCULATION_DISTANCE || timeElapsed > GPS_RECALCULATION_TIME_MS)) {
          lastCalcPosRef.current = newPos;
          lastCalcTimeRef.current = now;
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsWarning("GPS Permission Denied.");
          onRouteCalculatedRef.current?.({ gpsStatus: "PERMISSION_DENIED" });
        } else {
          setGpsWarning("GPS Signal Unavailable.");
          onRouteCalculatedRef.current?.({ gpsStatus: "UNAVAILABLE" });
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [navState, simulatedPos, isOffline, destination, onRouteCalculated]);

  // Handle Map Action Commands (Center on Me, Fit Entire Route, Reset North, Zoom Destination)
  useEffect(() => {
    if (!mapAction || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const { type } = mapAction;

    if (type === "CENTER_ON_ME") {
      if (isValidCoord(activeELat, activeELng)) {
        map.flyTo({ center: [Number(activeELng), Number(activeELat)], zoom: 16, duration: 1000 });
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setExecutivePos({ lat, lng });
            map.flyTo({ center: [lng, lat], zoom: 16, duration: 1000 });
          },
          (err) => console.warn("Center on Me GPS error:", err),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } else if (type === "FIT_ROUTE") {
      const bounds = new tt.LngLatBounds();
      if (isValidCoord(pLat, pLng)) bounds.extend([Number(pLng), Number(pLat)]);
      if (isValidCoord(dLat, dLng)) bounds.extend([Number(dLng), Number(dLat)]);
      if (isValidCoord(activeELat, activeELng)) bounds.extend([Number(activeELng), Number(activeELat)]);
      if (bounds.getNorthEast() && bounds.getSouthWest()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
      }
    } else if (type === "RESET_NORTH") {
      map.easeTo({ bearing: 0, pitch: 0, duration: 800 });
    } else if (type === "ZOOM_DESTINATION" && isValidCoord(dLat, dLng)) {
      map.flyTo({ center: [Number(dLng), Number(dLat)], zoom: 16, duration: 1000 });
    }
  }, [mapAction, activeELat, activeELng, pLat, pLng, dLat, dLng]);

  // Map Initialization & Polyline Fetch with Timeout & Preservation
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!apiKey) {
      setError("TomTom API Key is not configured.");
      setLoading(false);
      return;
    }

    let defaultCenter = [75.8577, 22.7196];

    const hasPickup = isValidCoord(pLat, pLng);
    const hasDest = isValidCoord(dLat, dLng);
    const hasExec = isValidCoord(activeELat, activeELng);

    const routeStartLat = hasExec ? activeELat : pLat;
    const routeStartLng = hasExec ? activeELng : pLng;
    const hasValidStart = isValidCoord(routeStartLat, routeStartLng);

    if (hasExec) {
      defaultCenter = [Number(activeELng), Number(activeELat)];
    } else if (hasPickup) {
      defaultCenter = [Number(pLng), Number(pLat)];
    } else if (hasDest) {
      defaultCenter = [Number(dLng), Number(dLat)];
    }

    try {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = tt.map({
        key: apiKey,
        container: mapContainerRef.current,
        center: defaultCenter,
        zoom: 13,
        stylesVisibility: {
          poi: true,
          trafficFlow: false,
          trafficIncidents: false,
        },
      });

      mapInstanceRef.current = map;

      map.on("load", async () => {
        setLoading(false);
        setRouteError(null);
        const bounds = new tt.LngLatBounds();
        let validMarkerCount = 0;

        // 1. Pickup Marker (Green)
        if (hasPickup) {
          const pickupLngLat = [Number(pLng), Number(pLat)];
          const pickupEl = createCustomMarkerElement("pickup");
          const pickupPopup = new tt.Popup({ offset: 35 }).setHTML(`
            <div class="p-2 text-slate-800 font-sans">
              <div class="flex items-center gap-1.5 font-bold text-xs text-emerald-600 mb-1 uppercase tracking-wider">
                <span>📍 Pickup Point</span>
              </div>
              <p class="text-sm font-semibold text-slate-900">${pickup?.name || "Branch Location"}</p>
              <p class="text-xs text-slate-500 mt-0.5">${pAddr || "Branch Address"}</p>
            </div>
          `);

          new tt.Marker({ element: pickupEl })
            .setLngLat(pickupLngLat)
            .setPopup(pickupPopup)
            .addTo(map);

          bounds.extend(pickupLngLat);
          validMarkerCount++;
        }

        // 2. Destination Marker (Red)
        if (hasDest) {
          const destLngLat = [Number(dLng), Number(dLat)];
          const destEl = createCustomMarkerElement("destination");
          const destPopup = new tt.Popup({ offset: 35 }).setHTML(`
            <div class="p-2 text-slate-800 font-sans">
              <div class="flex items-center gap-1.5 font-bold text-xs text-rose-600 mb-1 uppercase tracking-wider">
                <span>🎯 Destination Target</span>
              </div>
              <p class="text-sm font-semibold text-slate-900">${destination?.name || "Customer Location"}</p>
              <p class="text-xs text-slate-500 mt-0.5">${dAddr || "Customer Address"}</p>
            </div>
          `);

          new tt.Marker({ element: destEl })
            .setLngLat(destLngLat)
            .setPopup(destPopup)
            .addTo(map);

          bounds.extend(destLngLat);
          validMarkerCount++;
        }

        // 3. Executive GPS Marker (Blue)
        if (hasExec) {
          const execLngLat = [Number(activeELng), Number(activeELat)];
          const execEl = createCustomMarkerElement("executive");
          const execPopup = new tt.Popup({ offset: 35 }).setHTML(`
            <div class="p-2 text-slate-800 font-sans">
              <div class="flex items-center gap-1.5 font-bold text-xs text-blue-600 mb-1 uppercase tracking-wider">
                <span>🧭 Executive Location</span>
              </div>
              <p class="text-sm font-semibold text-slate-900">${simulatedPos ? "Simulated Position" : "Live GPS Position"}</p>
              <p class="text-xs text-slate-500 mt-0.5">${Number(activeELat).toFixed(5)}, ${Number(activeELng).toFixed(5)}</p>
            </div>
          `);

          const marker = new tt.Marker({ element: execEl })
            .setLngLat(execLngLat)
            .setPopup(execPopup)
            .addTo(map);

          execMarkerRef.current = marker;
          bounds.extend(execLngLat);
          validMarkerCount++;
        }

        // Handle missing coordinate errors
        if (!hasValidStart && hasDest) {
          setRouteError("Missing start location coordinates.");
          onRouteCalculatedRef.current?.({ status: "UNAVAILABLE", reason: "MISSING_START" });
        } else if (hasValidStart && !hasDest) {
          setRouteError("Missing destination location coordinates.");
          onRouteCalculatedRef.current?.({ status: "UNAVAILABLE", reason: "MISSING_DESTINATION" });
        } else if (!hasValidStart && !hasDest) {
          setRouteError("Missing coordinates.");
          onRouteCalculatedRef.current?.({ status: "UNAVAILABLE", reason: "MISSING_COORDINATES" });
        }

        // 4. TomTom Routing API - Polyline Calculation with 10s Timeout & Preservation
        if (hasValidStart && hasDest) {
          if (isCalculatingRouteRef.current) return;
          isCalculatingRouteRef.current = true;
          setRouteLoading(true);
          onRouteCalculatedRef.current?.({ status: "CALCULATING" });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), ROUTING_API_TIMEOUT_MS);

          try {
            let routingUrl = `https://api.tomtom.com/routing/1/calculateRoute/${routeStartLat},${routeStartLng}:${dLat},${dLng}/json?key=${apiKey}`;

            // Multi-stage waypoint routing: Executive Position -> Pickup Location -> Destination
            if (hasExec && hasPickup && hasDest) {
              routingUrl = `https://api.tomtom.com/routing/1/calculateRoute/${activeELat},${activeELng}:${pLat},${pLng}:${dLat},${dLng}/json?key=${apiKey}`;
            }

            const response = await fetch(routingUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
              const resData = await response.json();
              const route = resData.routes?.[0];
              if (route && route.legs?.length > 0) {
                const points = route.legs.flatMap((leg) => leg.points || []);
                const summary = route.summary;
                const coordinates = points.map((pt) => [pt.longitude, pt.latitude]);
                activePolylinePointsRef.current = points;

                if (map.getLayer("route-line")) map.removeLayer("route-line");
                if (map.getSource("route")) map.removeSource("route");

                const geojson = {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: coordinates,
                  },
                };

                map.addSource("route", {
                  type: "geojson",
                  data: geojson,
                });

                map.addLayer({
                  id: "route-line",
                  type: "line",
                  source: "route",
                  paint: {
                    "line-color": "#2563eb",
                    "line-width": 5,
                    "line-opacity": 0.85,
                  },
                });

                coordinates.forEach((coord) => bounds.extend(coord));
                setRouteError(null);

                if (onRouteCalculatedRef.current) {
                  onRouteCalculatedRef.current({
                    status: "AVAILABLE",
                    distanceMeters: summary.lengthInMeters,
                    travelTimeSeconds: summary.travelTimeInSeconds,
                    routePoints: points,
                  });
                }
              } else {
                setRouteError("Unable to calculate route.");
                onRouteCalculatedRef.current?.({ status: "UNAVAILABLE", reason: "EMPTY_ROUTE" });
              }
            } else {
              setRouteError("Route service unavailable. Retry.");
              onRouteCalculatedRef.current?.({ status: "UNAVAILABLE", reason: "API_FAILURE" });
            }
          } catch (rErr) {
            clearTimeout(timeoutId);
            if (rErr.name === "AbortError") {
              setRouteError("Route calculation timed out. Retrying...");
              onRouteCalculatedRef.current?.({ status: "UNAVAILABLE", reason: "TIMEOUT" });
            } else {
              setRouteError("Route service unavailable. Retry.");
              onRouteCalculatedRef.current?.({ status: "UNAVAILABLE", reason: "FETCH_ERROR" });
            }
          } finally {
            isCalculatingRouteRef.current = false;
            setRouteLoading(false);
          }
        }

        // Smoothly animate viewport bounds
        if (validMarkerCount > 1 || (hasValidStart && hasDest)) {
          if (bounds.getNorthEast() && bounds.getSouthWest()) {
            map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
          }
        } else if (hasExec && isValidCoord(activeELat, activeELng)) {
          map.setCenter([Number(activeELng), Number(activeELat)]);
          map.setZoom(15);
        } else if (validMarkerCount === 1) {
          if (bounds.getCenter()) {
            map.setCenter(bounds.getCenter());
            map.setZoom(14);
          }
        }

        if (onMapLoadRef.current) {
          onMapLoadRef.current(map, tt);
        }
      });
    } catch (err) {
      setError("Failed to initialize TomTom map canvas.");
      setLoading(false);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pLat, pLng, pAddr, dLat, dLng, dAddr, navState, recalculateTrigger, apiKey, onMapLoad, onRouteCalculated]);

  // Handle Executive Marker Creation & Dynamic Updates without map canvas re-initialization
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const hasExec = isValidCoord(activeELat, activeELng);

    if (hasExec) {
      const execLngLat = [Number(activeELng), Number(activeELat)];
      if (!execMarkerRef.current) {
        const execEl = createCustomMarkerElement("executive");
        const execPopup = new tt.Popup({ offset: 35 }).setHTML(`
          <div class="p-2 text-slate-800 font-sans">
            <div class="flex items-center gap-1.5 font-bold text-xs text-blue-600 mb-1 uppercase tracking-wider">
              <span>🧭 Executive Location</span>
            </div>
            <p class="text-sm font-semibold text-slate-900">${simulatedPos ? "Simulated Position" : "Live GPS Position"}</p>
            <p class="text-xs text-slate-500 mt-0.5">${Number(activeELat).toFixed(5)}, ${Number(activeELng).toFixed(5)}</p>
          </div>
        `);

        const marker = new tt.Marker({ element: execEl })
          .setLngLat(execLngLat)
          .setPopup(execPopup)
          .addTo(map);

        execMarkerRef.current = marker;
      }
    } else {
      if (execMarkerRef.current) {
        execMarkerRef.current.remove();
        execMarkerRef.current = null;
      }
    }
  }, [navState, activeELat, activeELng, simulatedPos]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100 ${className}`} style={{ height }}>
      {/* Loading Skeleton */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-sm text-slate-700">
          <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
          <span className="text-xs font-semibold text-slate-600">Initializing TomTom Maps Engine...</span>
        </div>
      )}

      {/* Route Calculation Overlay Badge */}
      {routeLoading && !loading && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/90 backdrop-blur-md text-white text-xs font-semibold shadow-md animate-pulse">
          <Loader2 size={14} className="animate-spin" />
          <span>Calculating TomTom Driving Route...</span>
        </div>
      )}

      {/* Error View */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-800 text-center">
          <AlertTriangle size={32} className="text-amber-500 mb-2" />
          <p className="text-sm font-bold text-slate-800">{error}</p>
          <p className="text-xs text-slate-500 mt-1">Please verify TomTom configuration or network connection.</p>
        </div>
      )}

      {/* Friendly Route Error Badge */}
      {routeError && !error && !loading && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/95 backdrop-blur-md text-white text-xs font-semibold shadow-md">
          <AlertTriangle size={14} />
          <span>{routeError}</span>
        </div>
      )}

      {/* Non-blocking GPS Warning Badge */}
      {gpsWarning && !error && !routeError && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/90 backdrop-blur-md text-white text-xs font-semibold shadow-md">
          <AlertTriangle size={14} />
          <span>{gpsWarning}</span>
        </div>
      )}

      {/* Map Legend Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 text-xs font-semibold shadow-md overflow-x-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span>Destination</span>
          </div>
          {activeELat && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Executive</span>
            </div>
          )}
        </div>
        <span className="text-[10px] text-slate-400 font-normal">TomTom Web SDK</span>
      </div>

      {/* Native TomTom Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
