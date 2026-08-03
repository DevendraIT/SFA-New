import React from "react";
import { motion } from "framer-motion";
import { Navigation, MapPin, Compass, Clock, ArrowRight, ExternalLink } from "lucide-react";

export default function RouteMap({
  userLocation,
  destination,
  distanceMeters,
  estimatedMinutes,
  googleMapsUrl,
  className = "",
}) {
  const originLat = userLocation?.lat?.toFixed(5) || "N/A";
  const originLng = userLocation?.lng?.toFixed(5) || "N/A";
  const destLat = destination?.lat ? Number(destination.lat).toFixed(5) : "N/A";
  const destLng = destination?.lng ? Number(destination.lng).toFixed(5) : "N/A";
  const distKm = distanceMeters ? (distanceMeters / 1000).toFixed(2) : "0.00";

  const handleOpenGoogleMaps = () => {
    if (googleMapsUrl) {
      window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
    } else if (destination?.lat && destination?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-700/50 ${className}`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Live Route Navigation</h3>
            <p className="text-xs text-slate-400">GPS Optimized Navigation Route</p>
          </div>
        </div>

        <button
          onClick={handleOpenGoogleMaps}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Navigation size={16} /> Live Navigation (TomTom / Maps) <ExternalLink size={14} />
        </button>
      </div>

      {/* Visual Route Canvas Representation */}
      <div className="relative my-6 rounded-2xl bg-slate-950/60 border border-slate-800 p-6 overflow-hidden">
        {/* Animated Background Vector Lines */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Origin Card */}
          <div className="flex-1 w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-blue-500 animate-ping absolute" />
              <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white relative" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Current Executive Position</p>
              <p className="text-sm font-bold text-slate-100">
                {userLocation ? `${originLat}, ${originLng}` : "Detecting Browser GPS..."}
              </p>
            </div>
          </div>

          {/* Distance / Duration Connector Badge */}
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold whitespace-nowrap shadow-inner">
              <span>{distKm} km</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock size={12} /> ~{estimatedMinutes || 5} min</span>
            </div>
            <ArrowRight size={18} className="text-blue-400 hidden md:block mt-1 animate-pulse" />
          </div>

          {/* Destination Card */}
          <div className="flex-1 w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0">
              <MapPin size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider truncate">Target Customer Location</p>
              <p className="text-sm font-bold text-slate-100 truncate">{destination?.address || destination?.name || "Customer Destination"}</p>
              <p className="text-[10px] text-slate-400">{destLat}, {destLng}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Task Target Interactive Map Iframe */}
        {destination?.lat && destination?.lng && (
          <div className="mt-4 rounded-xl overflow-hidden border border-slate-800 h-48 w-full bg-slate-900">
            <iframe
              title="Task Navigation Map"
              width="100%"
              height="100%"
              frameBorder="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${destination.lng - 0.01},${destination.lat - 0.01},${Number(destination.lng) + 0.01},${Number(destination.lat) + 0.01}&layer=mapnik&marker=${destination.lat},${destination.lng}`}
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* Footer Info Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
          <p className="text-slate-400">Total Distance</p>
          <p className="text-base font-extrabold text-blue-400 mt-0.5">{distKm} km</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
          <p className="text-slate-400">Est. Travel Time</p>
          <p className="text-base font-extrabold text-emerald-400 mt-0.5">{estimatedMinutes || 5} mins</p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
          <p className="text-slate-400">Navigation Engine</p>
          <p className="text-base font-bold text-slate-200 mt-0.5">TomTom Routing API</p>
        </div>
      </div>
    </div>
  );
}
