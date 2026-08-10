import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Compass,
  Navigation,
  AlertTriangle,
  Play,
  Square,
  FlaskConical,
  CheckCircle2,
  RefreshCw,
  Locate,
  Maximize2,
  Target,
  Wifi,
  WifiOff,
  Gauge,
  Check,
} from "lucide-react";
import TomTomMap, { ARRIVAL_RADIUS_METERS } from "../map/TomTomMap";

const SESSION_KEY = "SFA_NAV_SESSION";

export default function RouteMap({
  userLocation,
  destination,
  pickup,
  task,
  distanceMeters,
  estimatedMinutes,
  className = "",
  onRouteCalculated,
}) {
  const [routeCalc, setRouteCalc] = useState(null);
  const [navState, setNavState] = useState("IDLE"); // "IDLE" | "NAVIGATING" | "ARRIVED" | "STOPPED" | "DEVIATED"
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const [recalculateTrigger, setRecalculateTrigger] = useState(0);
  const [mapAction, setMapAction] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [initialDistMeters, setInitialDistMeters] = useState(null);

  const isDev = import.meta.env.DEV === true;

  // Pickup Location explicitly prioritized from Task model (set by Sales Manager during assignment)
  const pickupPoint = {
    latitude: task?.pickupLatitude ?? pickup?.latitude ?? pickup?.lat,
    longitude: task?.pickupLongitude ?? pickup?.longitude ?? pickup?.lng,
    address: task?.pickupAddress || pickup?.address || "Pickup Location",
    name: "Pickup Location",
  };

  // Destination Location explicitly prioritized from Task model
  const destPoint = {
    latitude: task?.destinationLatitude ?? destination?.latitude ?? destination?.lat,
    longitude: task?.destinationLongitude ?? destination?.longitude ?? destination?.lng,
    address: task?.destinationAddress || destination?.address || destination?.name || "Customer Destination",
    name: destination?.name || "Target Destination",
  };

  const execPoint = userLocation && userLocation.lat && userLocation.lng ? {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    name: "Executive Position",
  } : null;

  // Session Recovery via sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.navState && parsed.taskId === (task?.id || "active")) {
          setNavState(parsed.navState);
          setInitialDistMeters(parsed.initialDistMeters);
        }
      }
    } catch (err) {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [task?.id]);

  // Online / Offline Monitor
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync session state to sessionStorage
  useEffect(() => {
    if (navState === "NAVIGATING" || navState === "ARRIVED" || navState === "DEVIATED") {
      try {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            taskId: task?.id || "active",
            navState,
            initialDistMeters,
          })
        );
      } catch (err) {}
    } else if (navState === "STOPPED" || navState === "IDLE") {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [navState, initialDistMeters, task?.id]);

  const routePoints = routeCalc?.routePoints || [];
  const simulatedPos = (isSimulating && routePoints.length > 0 && simStepIndex < routePoints.length)
    ? {
        latitude: routePoints[simStepIndex].latitude,
        longitude: routePoints[simStepIndex].longitude,
      }
    : null;

  // Dev Simulation Timer
  useEffect(() => {
    let timer = null;
    if (isDev && isSimulating && routePoints.length > 0 && (navState === "NAVIGATING" || navState === "DEVIATED")) {
      timer = setInterval(() => {
        setSimStepIndex((prev) => (prev + 1 < routePoints.length ? prev + 1 : 0));
      }, 3000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isDev, isSimulating, routePoints.length, navState]);

  const handleStartNavigation = () => {
    setNavState("NAVIGATING");
  };

  const handleStopNavigation = () => {
    setNavState("STOPPED");
    setIsSimulating(false);
    setSimStepIndex(0);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const handleFinishNavigation = () => {
    setNavState("STOPPED");
    setIsSimulating(false);
    setSimStepIndex(0);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const handleManualRecalculate = () => {
    if (routeCalc?.status === "CALCULATING" || isOffline) return;
    setRecalculateTrigger((prev) => prev + 1);
  };

  const handleToggleSimulation = () => {
    if (!isSimulating) {
      setNavState("NAVIGATING");
      setIsSimulating(true);
      setSimStepIndex(0);
    } else {
      setIsSimulating(false);
      setSimStepIndex(0);
    }
  };

  const triggerMapAction = (type) => {
    setMapAction({ type, trigger: Date.now() });
  };

  const pickupLat = pickupPoint.latitude != null ? Number(pickupPoint.latitude).toFixed(5) : "N/A";
  const pickupLng = pickupPoint.longitude != null ? Number(pickupPoint.longitude).toFixed(5) : "N/A";
  const destLat = destPoint.latitude != null ? Number(destPoint.latitude).toFixed(5) : "N/A";
  const destLng = destPoint.longitude != null ? Number(destPoint.longitude).toFixed(5) : "N/A";

  const activeDistanceMeters = routeCalc?.distanceMeters ?? distanceMeters;
  const remainingDistKm = activeDistanceMeters ? (activeDistanceMeters / 1000).toFixed(2) : "0.00";
  const routeStatus = routeCalc?.status || "AVAILABLE";

  // Lock Original Route Distance ONLY when TomTom Routing API returns actual driving distance
  useEffect(() => {
    if (routeCalc?.distanceMeters && routeCalc?.status === "AVAILABLE") {
      setInitialDistMeters((prev) => {
        if (!prev || routeCalc.distanceMeters > prev) {
          return routeCalc.distanceMeters;
        }
        return prev;
      });
    }
  }, [routeCalc?.distanceMeters, routeCalc?.status]);

  const origDistKm = initialDistMeters ? (initialDistMeters / 1000).toFixed(2) : remainingDistKm;
  const distCoveredMeters = initialDistMeters ? Math.max(0, initialDistMeters - (activeDistanceMeters || 0)) : 0;
  const distCoveredKm = (distCoveredMeters / 1000).toFixed(2);

  // Progress Percentage calculation
  const progressPct = initialDistMeters && initialDistMeters > 0
    ? Math.max(0, Math.min(100, Math.round((distCoveredMeters / initialDistMeters) * 100)))
    : navState === "ARRIVED" ? 100 : 0;

  const distanceOffRoute = routeCalc?.distanceOffRoute || 0;
  const isDeviated = navState === "DEVIATED" || routeCalc?.navStatus === "DEVIATED";
  const hasArrived = navState === "ARRIVED" || routeCalc?.navStatus === "ARRIVED";

  // Shallow equality comparison to completely stop infinite render loop (Maximum update depth exceeded)
  const handleRouteCalculated = useCallback((data) => {
    setRouteCalc((prev) => {
      if (!prev) return data;
      let hasChange = false;
      for (const key in data) {
        if (prev[key] !== data[key]) {
          hasChange = true;
          break;
        }
      }
      return hasChange ? { ...prev, ...data } : prev;
    });

    if (onRouteCalculated) {
      onRouteCalculated(data);
    }

    if (data.navStatus && data.navStatus !== navState) {
      if (data.navStatus === "ARRIVED") {
        setNavState("ARRIVED");
      } else if (data.navStatus === "DEVIATED" && navState !== "DEVIATED") {
        setNavState("DEVIATED");
      }
    }
  }, [navState, onRouteCalculated]);

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-700/50 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Live Driving Route Navigation</h3>
            <p className="text-xs text-slate-400">Official TomTom Routing API Engine</p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Network Connection Badge */}
          {isOffline ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs font-bold text-rose-400 animate-pulse">
              <WifiOff size={14} />
              <span>Offline Mode</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-400">
              <Wifi size={14} className="text-emerald-400" />
              <span>Online</span>
            </div>
          )}

          {/* Start / Stop Navigation Session Button */}
          {navState !== "NAVIGATING" && navState !== "ARRIVED" && navState !== "DEVIATED" ? (
            <button
              onClick={handleStartNavigation}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Play size={14} /> Start Navigation
            </button>
          ) : (
            <button
              onClick={handleStopNavigation}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer"
            >
              <Square size={14} /> Stop Navigation
            </button>
          )}

          {/* Dev-Only Simulation Toggle */}
          {isDev && (
            <button
              onClick={handleToggleSimulation}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isSimulating
                  ? "bg-purple-600/30 border-purple-500 text-purple-300 shadow-inner"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
              title="Development Only: Simulate GPS Movement along route"
            >
              <FlaskConical size={14} className={isSimulating ? "animate-bounce text-purple-400" : "text-slate-400"} />
              <span>{isSimulating ? "Simulating..." : "Simulate GPS (Dev)"}</span>
            </button>
          )}

          {/* Navigation Status Badge */}
          {hasArrived ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-extrabold text-emerald-400 shadow-md">
              <CheckCircle2 size={14} />
              <span>ARRIVED</span>
            </div>
          ) : isDeviated ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-extrabold text-amber-400 shadow-md animate-pulse">
              <AlertTriangle size={14} />
              <span>DEVIATED</span>
            </div>
          ) : navState === "NAVIGATING" ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-xs font-extrabold text-blue-400 shadow-md">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>NAVIGATING</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400">
              <span>{navState}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Progress Bar */}
      {(navState === "NAVIGATING" || navState === "DEVIATED" || hasArrived) && (
        <div className="my-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">Navigation Progress</span>
            <span className="text-blue-400">{progressPct}% Complete</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation Completion Screen */}
      {hasArrived && (
        <div className="my-4 p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">✓ Destination Reached!</p>
                <p className="text-xs text-emerald-300">Navigation session completed within target radius.</p>
              </div>
            </div>

            <button
              onClick={handleFinishNavigation}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg transition cursor-pointer flex-shrink-0"
            >
              <Check size={16} /> Finish Navigation
            </button>
          </div>
        </div>
      )}

      {/* Route Deviation Banner */}
      {isDeviated && !hasArrived && (
        <div className="my-4 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">⚠ Route Deviation Detected</p>
              <p className="text-xs text-amber-300">Executive is {distanceOffRoute} meters off planned route.</p>
            </div>
          </div>

          <button
            onClick={handleManualRecalculate}
            disabled={routeStatus === "CALCULATING" || isOffline}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            <RefreshCw size={14} className={routeStatus === "CALCULATING" ? "animate-spin" : ""} />
            <span>{routeStatus === "CALCULATING" ? "Calculating Route..." : "Recalculate Route"}</span>
          </button>
        </div>
      )}

      {/* Interactive Map Controls Bar */}
      <div className="my-4 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => triggerMapAction("CENTER_ON_ME")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
        >
          <Locate size={14} className="text-blue-400" />
          <span>Center on Me</span>
        </button>
        <button
          onClick={() => triggerMapAction("FIT_ROUTE")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
        >
          <Maximize2 size={14} className="text-emerald-400" />
          <span>Fit Entire Route</span>
        </button>
        {/* <button
          onClick={() => triggerMapAction("RESET_NORTH")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
        >
          <Compass size={14} className="text-amber-400" />
          <span>Reset North</span>
        </button> */}
        <button
          onClick={() => triggerMapAction("ZOOM_DESTINATION")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
        >
          <Target size={14} className="text-rose-400" />
          <span>Zoom Destination</span>
        </button>
      </div>

      {/* Visual Route Location Summary Cards */}
      <div className="my-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup Location Card (Set by Sales Manager) */}
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <MapPin size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider truncate">Pickup Location (Assigned)</p>
              <p className="text-sm font-bold text-slate-100 truncate">{pickupPoint.address}</p>
              <p className="text-[10px] text-slate-400">{pickupLat}, {pickupLng}</p>
            </div>
          </div>

          {/* Destination Location Card */}
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
              <MapPin size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider truncate">Destination Location</p>
              <p className="text-sm font-bold text-slate-100 truncate">{destPoint.address}</p>
              <p className="text-[10px] text-slate-400">{destLat}, {destLng}</p>
            </div>
          </div>
        </div>

        {/* Native Official TomTom Map Container */}
        <div className="rounded-2xl overflow-hidden border border-slate-700/60">
          <TomTomMap
            pickup={pickupPoint}
            destination={destPoint}
            currentLocation={execPoint}
            showCurrentLocation={navState === "NAVIGATING" || navState === "ARRIVED" || navState === "DEVIATED"}
            navState={navState}
            simulatedPos={simulatedPos}
            recalculateTrigger={recalculateTrigger}
            mapAction={mapAction}
            height="380px"
            onRouteCalculated={handleRouteCalculated}
          />
        </div>
      </div>

      {/* Clean 3-Metric Real Distance Grid */}
      <div className="my-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/60 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Gauge size={16} className="text-blue-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live Journey Distance</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40 text-center sm:text-left">
            <p className="text-slate-400 text-[11px] font-medium">Original Distance</p>
            <p className="text-lg font-extrabold text-slate-100 mt-1">{origDistKm} km</p>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40 text-center sm:text-left">
            <p className="text-slate-400 text-[11px] font-medium">Remaining Distance</p>
            <p className="text-lg font-extrabold text-blue-400 mt-1">{remainingDistKm} km</p>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40 text-center sm:text-left">
            <p className="text-slate-400 text-[11px] font-medium">Distance Covered</p>
            <p className="text-lg font-extrabold text-emerald-400 mt-1">{distCoveredKm} km</p>
          </div>
        </div>
      </div>
    </div>
  );
}
