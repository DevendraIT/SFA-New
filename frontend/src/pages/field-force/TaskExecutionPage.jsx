import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, RefreshCw, Loader2, CheckCircle2, Navigation, MapPin, Building2,
  ShoppingCart, Package, DollarSign, Camera, FileText, FileSignature, Check,
  Compass, Clock, AlertCircle, ShieldCheck, Phone, Mail, ChevronRight, XCircle
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import fieldForceApi from "../../api/fieldForce.api";
import RouteMap from "../../components/field-force/RouteMap";
import GeoFenceBanner, { calculateDistanceMeters } from "../../components/field-force/GeoFenceBanner";
import SignaturePad from "../../components/field-force/SignaturePad";
import TaskStatusBadge from "../../components/team/TaskStatusBadge";
import ErrorState from "../../components/dashboard/ErrorState";
import dayjs from "dayjs";

// Resolve photo URLs — stored as relative paths like /uploads/photos/photo-xxx.jpg
// Must be prefixed with the backend base URL, not the frontend server.
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
function getPhotoUrl(photo) {
  if (!photo) return null;
  if (typeof photo === 'string') {
    if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('blob:')) return photo;
    return `${API_BASE}${photo.startsWith('/') ? '' : '/'}${photo}`;
  }
  if (Array.isArray(photo) && photo.length > 0) return getPhotoUrl(photo[0]);
  return null;
}

const WORKFLOW_STEPS = [
  { status: "PENDING", label: "Assigned", icon: Clock },
  { status: "IN_PROGRESS", label: "Navigating", icon: Navigation },
  { status: "CHECKED_IN", label: "Checked In", icon: ShieldCheck },
  { status: "PHOTO_UPLOADED", label: "Photos & Notes", icon: Camera },
  { status: "PAYMENT_COLLECTED", label: "Payment (Optional)", icon: DollarSign },
  { status: "COMPLETED", label: "Completed", icon: CheckCircle2 },
];

export default function TaskExecutionPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [liveRouteData, setLiveRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // GPS Location state
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  // Form Inputs for specific steps
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [visitNotes, setVisitNotes] = useState("");
  const [signatureData, setSignatureData] = useState("");

  // Get current GPS Location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsAccuracy(pos.coords.accuracy);
        },
        (err) => console.warn("GPS error:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const loadTaskData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fieldForceApi.getTask(id);
      const taskData = res.data?.data || res.data?.message || res.data;
      setTask(taskData);

      if (taskData?.metadata?.payment?.amount) {
        setPaymentAmount(taskData.metadata.payment.amount.toString());
      }

      // Fetch route info
      try {
        const routeRes = await fieldForceApi.getTaskRoute(id, gpsLocation || {});
        setRouteInfo(routeRes.data?.data || routeRes.data);
      } catch (e) {
        console.warn("Route API error:", e);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load field task details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaskData();
  }, [id]);

  // Re-fetch backend route with live GPS coordinates as soon as browser GPS fix is acquired
  useEffect(() => {
    if (id && gpsLocation?.lat && gpsLocation?.lng) {
      fieldForceApi.getTaskRoute(id, gpsLocation)
        .then((res) => {
          const rData = res.data?.data || res.data;
          if (rData) setRouteInfo(rData);
        })
        .catch((err) => console.warn("Failed to update route with live GPS:", err));
    }
  }, [id, gpsLocation?.lat, gpsLocation?.lng]);

  const metadata = typeof task?.metadata === "object" && task?.metadata !== null
    ? task.metadata
    : (typeof task?.metadata === "string"
        ? (() => { try { return JSON.parse(task.metadata); } catch(e) { return {}; } })()
        : {});
  const customer = typeof metadata.customer === "object" && metadata.customer !== null ? metadata.customer : {};
  const order = typeof metadata.order === "object" && metadata.order !== null ? metadata.order : {};
  const products = Array.isArray(metadata.products) ? metadata.products : [];
  const requirements = typeof metadata.requirements === "object" && metadata.requirements !== null ? metadata.requirements : {};
  const instructions = Array.isArray(metadata.instructions) ? metadata.instructions : [];

  const destLat = task?.destinationLatitude ?? customer.lat ?? metadata.location?.lat ?? metadata.destination?.lat;
  const destLng = task?.destinationLongitude ?? customer.lng ?? metadata.location?.lng ?? metadata.destination?.lng;
  const targetCoords = destLat != null && destLng != null ? { lat: Number(destLat), lng: Number(destLng) } : null;

  const currentDistance = calculateDistanceMeters(
    gpsLocation?.lat,
    gpsLocation?.lng,
    targetCoords?.lat,
    targetCoords?.lng
  );
  const testingMode = true; // Testing Mode: Allow Check-In / Arrived actions from any location
  const isWithinGeoFence = testingMode ? true : (currentDistance !== null ? currentDistance <= 100 : true);

  const handleStatusTransition = async (nextStatus, extraData = {}) => {
    try {
      setActionLoading(true);
      const payload = {
        status: nextStatus,
        location: gpsLocation || undefined,
        ...extraData,
      };

      await fieldForceApi.updateTaskStatus(id, payload);
      toast.success(`Task status updated to ${nextStatus.replace(/_/g, " ")}`);
      await loadTaskData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update task status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAndSavePhotoAndNotes = async () => {
    try {
      setUploadingPhoto(true);
      let finalUrl = photoUrl;
      if (selectedFile) {
        const res = await fieldForceApi.uploadPhoto(selectedFile);
        finalUrl = res.data?.data?.url || res.data?.url || photoUrl;
      }
      await handleStatusTransition("PHOTO_UPLOADED", {
        photoUrl: finalUrl,
        notes: visitNotes || undefined,
      });
      toast.success("Photos & Visit Notes saved successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save photo and visit notes");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading task execution workflow...</p>
      </div>
    );
  }

  if (error || !task) {
    return <ErrorState message={typeof error === "string" ? error : (error?.message || "Failed to load field task details")} onRetry={loadTaskData} />;
  }

  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.status === task.status);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/field-force/tasks"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium transition"
        >
          <ArrowLeft size={16} /> Back to My Tasks
        </Link>
        <button
          onClick={loadTaskData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition self-start sm:self-auto"
        >
          <RefreshCw size={16} /> Refresh Workflow
        </button>
      </div>

      {/* Task Header & Status Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <TaskStatusBadge status={task.status} />
              {task.priority && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  {task.priority} Priority
                </span>
              )}
              {metadata.category && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                  {metadata.category}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">{task.title}</h1>
            {task.description && <p className="text-sm text-slate-600 mt-1">{task.description}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-right">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Target Customer</p>
              <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{customer.name || "Customer Visit"}</p>
            </div>
          </div>
        </div>

        {/* 12-Step Visual Timeline Progress Bar */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Execution Workflow Lifecycle</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {WORKFLOW_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isPast = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={step.status}
                  className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-105"
                      : isPast
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-slate-50 text-slate-400 border-slate-200"
                  }`}
                >
                  <StepIcon size={16} />
                  <span className="text-[10px] font-bold mt-1 line-clamp-1">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Route Map */}
      <RouteMap
        task={task}
        userLocation={gpsLocation}
        destination={{
          lat: task?.destinationLatitude ?? targetCoords?.lat,
          lng: task?.destinationLongitude ?? targetCoords?.lng,
          address: task?.destinationAddress || customer.address || customer.name || "Customer Destination",
        }}
        pickup={{
          lat: task?.pickupLatitude,
          lng: task?.pickupLongitude,
          address: task?.pickupAddress || "Branch Location",
        }}
        distanceMeters={routeInfo?.distanceMeters || currentDistance}
        estimatedMinutes={routeInfo?.estimatedMinutes}
        onRouteCalculated={(data) => {
          if (data?.distanceMeters) {
            setLiveRouteData((prev) => (prev?.distanceMeters === data.distanceMeters ? prev : data));
          }
        }}
      />

      {/* Geo-Fence Banner */}
      <GeoFenceBanner
        userLocation={gpsLocation}
        targetLocation={targetCoords}
        accuracy={gpsAccuracy}
        testingMode={testingMode}
        overrideDistanceMeters={liveRouteData?.distanceMeters ?? routeInfo?.distanceMeters ?? currentDistance}
      />

      {/* Primary Execution Control Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Compass className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Next Execution Action</h3>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>

        {/* Step Action Controls */}
        {task.status === "PENDING" || task.status === "ASSIGNED" || task.status === "ACCEPTED" ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center space-y-4">
            <h4 className="font-bold text-blue-900 text-base">Start Task & Navigation</h4>
            <p className="text-xs text-blue-700 max-w-md mx-auto">
              Click Start Task to begin your field route navigation towards the customer location.
            </p>
            <button
              onClick={() => handleStatusTransition("IN_PROGRESS")}
              disabled={actionLoading}
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin inline mr-2" /> : <Navigation size={16} className="inline mr-2" />}
              Start Task
            </button>
          </div>
        ) : task.status === "IN_PROGRESS" || task.status === "NAVIGATING" || task.status === "ARRIVED" ? (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center space-y-4">
            <h4 className="font-bold text-teal-900 text-base">Arrived & Geo Check-In</h4>
            <p className="text-xs text-teal-700 max-w-md mx-auto">
              {testingMode
                ? "Perform Check-In to log your GPS arrival coordinates at customer destination."
                : "Perform Geo Check-In once you are within 100 meters of customer coordinates."}
            </p>
            <button
              onClick={() => handleStatusTransition("CHECKED_IN")}
              disabled={actionLoading || (!testingMode && !isWithinGeoFence)}
              className="px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-teal-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin inline mr-2" /> : <ShieldCheck size={16} className="inline mr-2" />}
              Geo Check-In
            </button>
            {!testingMode && !isWithinGeoFence && (
              <p className="text-xs text-red-600 font-medium">Check-In requires being within 100 meters of customer coordinates.</p>
            )}
          </div>
        ) : task.status === "CHECKED_IN" || task.status === "DELIVERY_IN_PROGRESS" ? (
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
              <Camera size={18} className="text-blue-600" />
              <h4 className="font-bold text-blue-900 text-base">Upload Visit Photos & Visit Notes</h4>
            </div>

            {/* Combined Photo Upload UI in Application Blue Theme */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Product / Visit Photo Proof</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />

              {/* Photo Preview rendering: show local preview blob OR saved task photo after save */}
              {(photoPreview || getPhotoUrl(task.photos) || photoUrl) && (
                <div className="mt-3 rounded-xl overflow-hidden border border-blue-200 bg-slate-900/5">
                  <img
                    src={photoPreview || getPhotoUrl(task.photos) || photoUrl}
                    alt="Delivery Photo Proof"
                    className="w-full object-contain max-h-64 rounded-xl"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 bg-slate-900/80 text-white">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    {photoPreview ? 'New Photo Selected — Ready to Save' : 'Saved Photo Proof'}
                  </span>
                </div>
              )}
            </div>

            {/* Visit Notes Textarea on the same screen */}
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Visit Notes & Summary</label>
              <textarea
                rows={3}
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Enter customer feedback, meeting summary, or delivery notes..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <button
              onClick={handleUploadAndSavePhotoAndNotes}
              disabled={actionLoading || uploadingPhoto}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {actionLoading || uploadingPhoto ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {uploadingPhoto ? "Uploading Photo..." : "Save Photos & Visit Notes"}
            </button>
          </div>
        ) : task.status === "PHOTO_UPLOADED" || task.status === "VISIT_NOTES_COMPLETED" ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-emerald-900 text-base">Payment Collection (Optional)</h4>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">Optional</span>
            </div>
            <p className="text-xs text-emerald-700">
              Record customer payment below, or click Skip Payment Collection if payment was already received or not required.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Collected (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / Online</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() =>
                  handleStatusTransition("PAYMENT_COLLECTED", {
                    payment: { amount: parseFloat(paymentAmount) || 0, method: paymentMethod, status: "COLLECTED" },
                  })
                }
                disabled={actionLoading || !paymentAmount}
                className="flex-1 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin inline mr-2" /> : <DollarSign size={16} className="inline mr-2" />}
                Confirm Payment Collection
              </button>
              <button
                onClick={() => handleStatusTransition("COMPLETED")}
                disabled={actionLoading}
                className="flex-1 w-full py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                Skip Payment & Complete Task
              </button>
            </div>
          </div>
        ) : task.status === "PAYMENT_COLLECTED" || task.status === "CHECKED_OUT" ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
            <h4 className="font-bold text-emerald-900 text-base">Finalize Mission Completion</h4>
            <p className="text-xs text-emerald-700 max-w-md mx-auto">
              All task requirements, visit notes, and photo proofs are logged. Finalize mission completion.
            </p>
            <button
              onClick={() => handleStatusTransition("COMPLETED")}
              disabled={actionLoading}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin inline mr-2" /> : <CheckCircle2 size={16} className="inline mr-2" />}
              Mark Mission Completed
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <CheckCircle2 size={48} className="text-emerald-600 mx-auto mb-2" />
            <h4 className="font-extrabold text-emerald-900 text-lg">Mission Successfully Completed!</h4>
            <p className="text-xs text-emerald-700 mt-1">This task lifecycle has been completed and verified.</p>
          </div>
        )}
      </div>

      {/* Detail Metadata Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          {customer && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={20} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Customer Details</h3>
              </div>
              <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-4">
                <p className="font-bold text-slate-800 text-sm">{customer.name}</p>
                {customer.email && <div className="flex items-center gap-2 mt-2 text-xs text-slate-600"><Mail size={14} /> {customer.email}</div>}
                {customer.phone && <div className="flex items-center gap-2 mt-1 text-xs text-slate-600"><Phone size={14} /> {customer.phone}</div>}
                {customer.address && <div className="flex items-center gap-2 mt-1 text-xs text-slate-600"><MapPin size={14} /> {customer.address}</div>}
              </div>
            </div>
          )}

          {/* Linked Sales Order */}
          {(metadata.order || metadata.orderId) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} className="text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Linked Sales Order</h3>
                </div>
                {metadata.order?.status && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {metadata.order.status}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Order Number</span>
                  <span className="font-bold text-slate-800">{metadata.order?.orderNumber || metadata.orderId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Order Name</span>
                  <span className="font-bold text-slate-800">{metadata.order?.orderName || metadata.order?.orderNumber || "Sales Order"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Total Amount</span>
                  <span className="font-bold text-emerald-600">₹{(metadata.order?.totalAmount || metadata.order?.total || 0).toLocaleString()}</span>
                </div>
              </div>
              {Array.isArray(metadata.order?.items) && metadata.order.items.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-slate-700 mb-2">Order Products & Items List:</p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Item / Product</th>
                          <th className="px-3 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {metadata.order.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-medium text-slate-800">{item.name || item.description || `Item ${idx + 1}`}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-700">{item.quantity}</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800">₹{(item.unitPrice || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Package size={20} className="text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Order Items / Delivery Products</h3>
              </div>
              <div className="space-y-3">
                {products.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.name || `Item ${idx + 1}`}</p>
                      {item.sku && <p className="text-xs text-slate-500">SKU: {item.sku}</p>}
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs">
                      Qty: {item.quantity || 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Log Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Audit Trail & GPS Logs</h3>
            </div>
            {Array.isArray(task.executionHistory) && task.executionHistory.length > 0 ? (
              <div className="space-y-3">
                {task.executionHistory.map((hist, idx) => (
                  <div key={idx} className="flex items-start gap-3 border-l-2 border-blue-500 pl-4 py-1">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 uppercase">{hist.status?.replace(/_/g, " ")}</span>
                        <span className="text-[10px] text-slate-400">{dayjs(hist.timestamp).format("MMM D, h:mm A")}</span>
                      </div>
                      {hist.location && (
                        <p className="text-[11px] text-slate-500 mt-0.5">GPS: {hist.location.lat?.toFixed(4)}, {hist.location.lng?.toFixed(4)}</p>
                      )}
                      {hist.notes && <p className="text-xs text-slate-600 mt-1 italic">{hist.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No execution history recorded yet.</p>
            )}
          </div>
        </div>

        {/* Execution Requirements Checklist */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} className="text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Execution Requirements</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { key: "gps", label: "GPS Tracking", value: requirements.gps },
                { key: "photo", label: "Photo Proof", value: requirements.photo || !!task.photoUploadedAt },
                { key: "payment", label: "Payment Collection", value: requirements.payment || !!task.paymentCollectedAt },
                { key: "signature", label: "Digital Signature", value: requirements.signature || !!task.signatureCapturedAt },
                { key: "visitNotes", label: "Visit Notes", value: requirements.visitNotes || !!task.visitNotesCompletedAt },
              ].map((req) => (
                <div key={req.key} className={`flex items-center justify-between p-3 rounded-xl ${req.value ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"}`}>
                  <span className="text-xs font-semibold">{req.label}</span>
                  {req.value ? <Check size={16} className="text-emerald-600" /> : <Clock size={14} className="text-slate-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* Photo & Signature Preview */}
          {(task.photos || task.customerSignature) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Captured Artifacts</h3>
              {task.photos && (() => {
                const photoList = Array.isArray(task.photos)
                  ? task.photos.filter(Boolean)
                  : (task.photos ? [task.photos] : []);
                return photoList.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      Delivery Photos ({photoList.length})
                    </p>
                    <div className={`grid gap-2 ${photoList.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {photoList.map((photo, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          <img
                            src={getPhotoUrl(photo)}
                            alt={`Photo ${idx + 1}`}
                            className="w-full object-contain max-h-56"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                            }}
                          />
                          <div style={{ display: 'none' }} className="flex items-center justify-center gap-2 h-24 bg-orange-50 text-orange-600 text-xs font-semibold">
                            <AlertCircle size={16} /> Could not load photo
                          </div>
                          <span className="absolute top-1 left-1 bg-slate-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Photo {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
              {task.customerSignature && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Customer Digital Signature</p>
                  <img src={task.customerSignature} alt="Signature" className="w-full h-24 object-contain rounded-xl border border-slate-200 bg-slate-50 p-2" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
