import React from "react";
import { ShieldCheck, ShieldAlert, MapPin, Radio, CheckCircle2, AlertTriangle } from "lucide-react";

export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function GeoFenceBanner({
  userLocation,
  targetLocation,
  accuracy,
  className = "",
  testingMode = true,
  overrideDistanceMeters,
}) {
  const calculatedDist = calculateDistanceMeters(
    userLocation?.lat,
    userLocation?.lng,
    targetLocation?.lat,
    targetLocation?.lng
  );

  const distance = overrideDistanceMeters != null ? Math.round(overrideDistanceMeters) : calculatedDist;

  const isInRange = distance !== null && distance <= 100;
  const isDistanceAvailable = distance !== null;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-all ${
        testingMode
          ? "bg-blue-50/90 border-blue-300 text-blue-900"
          : isInRange
          ? "bg-emerald-50/90 border-emerald-300 text-emerald-900"
          : isDistanceAvailable
          ? "bg-amber-50/90 border-amber-300 text-amber-900"
          : "bg-slate-50 border-slate-300 text-slate-800"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              testingMode
                ? "bg-blue-600 text-white"
                : isInRange
                ? "bg-emerald-600 text-white"
                : isDistanceAvailable
                ? "bg-amber-500 text-white"
                : "bg-slate-400 text-white"
            }`}
          >
            {testingMode ? (
              <Radio size={22} className="animate-pulse" />
            ) : isInRange ? (
              <ShieldCheck size={22} />
            ) : (
              <ShieldAlert size={22} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm">
                {testingMode
                  ? "Geo-Fence Testing Mode Active"
                  : isInRange
                  ? "Geo-Fence Verification Passed"
                  : isDistanceAvailable
                  ? "Geo-Fence Range Warning"
                  : "Detecting Location Proximity"}
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  testingMode
                    ? "bg-blue-200 text-blue-800"
                    : isInRange
                    ? "bg-emerald-200 text-emerald-800"
                    : "bg-amber-200 text-amber-800"
                }`}
              >
                {testingMode
                  ? "Bypass Active (Testing Mode)"
                  : isInRange
                  ? "Within 100m Radius"
                  : "> 100m Distance"}
              </span>
            </div>

            <p className="text-xs mt-1 opacity-90">
              {testingMode
                ? `You are ${distance !== null ? distance + 'm' : 'calculating distance'} away. In Testing Mode, Check-In and Check-Out are allowed from any location while GPS coordinates are collected.`
                : isInRange
                ? "You have arrived at the customer location. Geo-fenced Check-In and Check-Out are unlocked."
                : isDistanceAvailable
                ? `You are currently ${distance} meters away from the customer location. Arrive and Check-In require being within 100 meters.`
                : "Awaiting GPS location signal to compute distance to customer target coordinates."}
            </p>
          </div>
        </div>

        {/* Real-time stats */}
        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-300/60 pt-3 sm:pt-0 sm:pl-4">
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Current Distance</p>
            <p className="text-lg font-extrabold">
              {distance !== null ? `${distance} m` : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">GPS Accuracy</p>
            <p className="text-xs font-bold text-slate-700 mt-1">
              {accuracy ? `±${Math.round(accuracy)} m` : "High"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
