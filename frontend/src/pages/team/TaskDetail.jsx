import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, RefreshCw, Loader2, CheckCircle2, Clock, User, CalendarDays, FileText,
  MapPin, ShoppingCart, Building2, Package, Route, Target, Camera, FileSignature,
  DollarSign, Map, Info, BookOpen, Flag, Phone, Mail, Globe, Navigation, Settings,
  Check, X as XIcon, KeyRound, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import fieldForceApi from "../../api/fieldForce.api";
import TaskStatusBadge from "../../components/team/TaskStatusBadge";
import ErrorState from "../../components/dashboard/ErrorState";
import dayjs from "dayjs";

function Section({ title, icon: Icon, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className="text-blue-600" />
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Badge({ label, color = "blue" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    indigo: "bg-indigo-100 text-indigo-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[color] || colors.slate}`}>
      {label}
    </span>
  );
}

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);

  const loadTask = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fieldForceApi.getTask(id);
      const taskData = res.data?.data || res.data?.message || res.data;
      setTask(taskData);
    } catch (err) {
      setError(err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [id]);

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await fieldForceApi.completeTask(id, { completionNotes: "Field mission completed" });
      toast.success("Field mission marked as completed!");
      loadTask();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to complete mission");
    } finally {
      setCompleting(false);
    }
  };

  const roleBasedBackLink = () => {
    if (window.location.pathname.startsWith('/field-force')) {
      return '/field-force/tasks';
    }
    return '/team/assigned-tasks';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-blue-600" /></div>;
  }
  if (error) {
    return <div className="p-6"><ErrorState message="Failed to load field mission details" onRetry={loadTask} /></div>;
  }
  if (!task) {
    return <div className="p-6"><ErrorState message="Field mission not found" /></div>;
  }

  const metadata = task.metadata || {};
  const customer = metadata.customer;
  const order = metadata.order;
  const products = metadata.products || [];
  const routeInfo = metadata.route;
  const visit = metadata.visit || {};
  const requirements = metadata.requirements || {};
  const instructions = metadata.instructions || [];
  const category = metadata.category;
  const assigneeName = task.assignedTo ? `${task.assignedTo.firstName || ""} ${task.assignedTo.lastName || ""}`.trim() : "Unassigned";
  const assignerName = task.assignedBy ? `${task.assignedBy.firstName || ""} ${task.assignedBy.lastName || ""}`.trim() : "Unknown";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to={roleBasedBackLink()} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft size={16} /> Back to Tasks
        </Link>
        <div className="flex gap-3">
          <button onClick={loadTask} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition">
            <RefreshCw size={16} /> Refresh
          </button>
          {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
            <button onClick={handleComplete} disabled={completing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50">
              {completing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {completing ? "Completing..." : "Mark Complete"}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <TaskStatusBadge status={task.status} size="lg" />
              {task.priority && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.priority === "URGENT" ? "bg-red-100 text-red-700" : task.priority === "HIGH" ? "bg-orange-100 text-orange-700" : task.priority === "MEDIUM" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>{task.priority}</span>
              )}
              {category && <Badge label={category.replace(/_/g, " ")} color="purple" />}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
            {task.description && <p className="text-slate-600 mt-2 leading-relaxed">{task.description}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Assignment Details" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-xs text-blue-600 font-medium mb-1">Assigned To</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">{assigneeName.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{assigneeName}</p>
                    {task.assignedTo?.email && <p className="text-xs text-slate-500">{task.assignedTo.email}</p>}
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs text-slate-500 font-medium mb-1">Assigned By</p>
                <p className="font-semibold text-slate-800 text-sm">{assignerName}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs text-slate-500 font-medium mb-1">Due Date</p>
                <p className="font-semibold text-slate-800 text-sm">{task.dueDate ? dayjs(task.dueDate).format("MMM D, YYYY h:mm A") : "No due date"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs text-slate-500 font-medium mb-1">Created</p>
                <p className="font-semibold text-slate-800 text-sm">{dayjs(task.createdAt).format("MMM D, YYYY")}</p>
              </div>
            </div>
            {task.completedAt && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Completed on {dayjs(task.completedAt).format("MMM D, YYYY h:mm A")}</span>
                </div>
                {task.completionNotes && <p className="text-xs text-slate-600 mt-1">{task.completionNotes}</p>}
              </div>
            )}
          </Section>

          {customer && (
            <Section title="Customer Details" icon={Building2}>
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="font-semibold text-slate-800">{customer.name}</p>
                {customer.email && <div className="flex items-center gap-2 mt-2 text-sm text-slate-600"><Mail size={14} /> {customer.email}</div>}
                {customer.phone && <div className="flex items-center gap-2 mt-1 text-sm text-slate-600"><Phone size={14} /> {customer.phone}</div>}
                {customer.lat && customer.lng && <div className="flex items-center gap-2 mt-1 text-sm text-slate-600"><MapPin size={14} /> {customer.lat}, {customer.lng}</div>}
              </div>
            </Section>
          )}

          {order && (
            <Section title="Linked Sales Order" icon={ShoppingCart}>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{order.orderNumber}</span>
                  <Badge label={order.status || "N/A"} color="green" />
                </div>
                {order.total && <div className="flex items-center gap-2 mt-2 text-sm text-slate-600"><DollarSign size={14} /> Total: ${Number(order.total).toLocaleString()}</div>}
              </div>
            </Section>
          )}

          {products.length > 0 && (
            <Section title="Products / Items" icon={Package}>
              <div className="space-y-3">
                {products.map((product, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-sm">{product.name || `Product ${idx + 1}`}</span>
                      <Badge label={`Qty: ${product.quantity || 1}`} color="blue" />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      {product.sku && <span>SKU: {product.sku}</span>}
                      {product.batch && <span>Batch: {product.batch}</span>}
                    </div>
                    {product.notes && <p className="text-xs text-slate-500 mt-1">{product.notes}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {routeInfo && (
            <Section title="Route Assignment" icon={Route}>
              <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Map size={16} className="text-indigo-600" />
                  <span className="font-semibold text-slate-800">{routeInfo.beatPlanTitle || "Route"}</span>
                </div>
                {routeInfo.startLocation && <div className="flex items-center gap-2 text-sm text-slate-600"><Navigation size={14} /> Start: {routeInfo.startLocation}</div>}
                {routeInfo.travelMode && <div className="flex items-center gap-2 mt-1 text-sm text-slate-600"><Globe size={14} /> Travel: {routeInfo.travelMode}</div>}
              </div>
            </Section>
          )}

          {visit.type && (
            <Section title="Visit Configuration" icon={MapPin}>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="font-semibold text-slate-800 text-sm mt-1">{visit.type.replace(/_/g, " ")}</p>
                </div>
                {visit.duration && <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Duration</p>
                  <p className="font-semibold text-slate-800 text-sm mt-1">{visit.duration} min</p>
                </div>}
                {visit.scheduledStart && <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Scheduled Start</p>
                  <p className="font-semibold text-slate-800 text-sm mt-1">{dayjs(visit.scheduledStart).format("MMM D, h:mm A")}</p>
                </div>}
                {visit.scheduledEnd && <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Scheduled End</p>
                  <p className="font-semibold text-slate-800 text-sm mt-1">{dayjs(visit.scheduledEnd).format("MMM D, h:mm A")}</p>
                </div>}
              </div>
            </Section>
          )}

          {instructions.length > 0 && (
            <Section title="Mission Instructions" icon={BookOpen}>
              <div className="space-y-3">
                {instructions.map((inst, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                    <div className="flex-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${inst.type === "WARNING" ? "bg-red-100 text-red-700" : inst.type === "ACTION" ? "bg-amber-100 text-amber-700" : inst.type === "INFO" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>{inst.type || "NOTE"}</span>
                      <p className="text-sm text-slate-600 mt-1">{inst.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {task.completionNotes && (
            <Section title="Completion Notes" icon={FileText}>
              <p className="text-sm text-slate-600">{task.completionNotes}</p>
            </Section>
          )}

          {/* Execution History & Audit Logs */}
          <Section title="Execution Audit Log & Activity Timestamps" icon={Clock}>
            {Array.isArray(task.executionHistory) && task.executionHistory.length > 0 ? (
              <div className="space-y-3">
                {task.executionHistory.map((hist, idx) => (
                  <div key={idx} className="flex items-start gap-3 border-l-2 border-blue-500 pl-4 py-1">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 uppercase">{hist.status?.replace(/_/g, " ")}</span>
                        <span className="text-[10px] text-slate-400">{dayjs(hist.timestamp).format("MMM D, YYYY h:mm A")}</span>
                      </div>
                      {hist.location && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <ShieldCheck size={12} /> Geo-Verified Location
                          </span>
                        </div>
                      )}
                      {hist.notes && <p className="text-xs text-slate-600 mt-1 italic">{hist.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No execution logs recorded yet.</p>
            )}
          </Section>

          {/* Payment Collection Details */}
          {(task.paymentAmount || task.paymentStatus) && (
            <Section title="Payment Collection Log" icon={DollarSign}>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-700 font-semibold">Amount Collected</p>
                  <p className="text-xl font-extrabold text-emerald-900 mt-1">₹{task.paymentAmount?.toLocaleString() || "0"}</p>
                  <p className="text-xs text-slate-500 mt-1">Method: {task.paymentMethod || "CASH"}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900 uppercase">
                  {task.paymentStatus || "COLLECTED"}
                </span>
              </div>
            </Section>
          )}

          {/* Photo & Customer Signature Proof */}
          {(task.photos || task.customerSignature) && (
            <Section title="Delivery Proof & Signature" icon={Camera}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {task.photos && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Proof Photo</p>
                    <img src={Array.isArray(task.photos) ? task.photos[0] : task.photos} alt="Proof" className="w-full h-40 object-cover rounded-xl border border-slate-200 shadow-sm" />
                  </div>
                )}
                {task.customerSignature && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Customer Signature</p>
                    <img src={task.customerSignature} alt="Signature" className="w-full h-40 object-contain rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm" />
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Section title="Executive" icon={User}>
            {task.assignedTo ? (
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto">{assigneeName.charAt(0)}</div>
                <p className="font-semibold text-slate-800 mt-3">{assigneeName}</p>
                {task.assignedTo.email && <p className="text-sm text-slate-500">{task.assignedTo.email}</p>}
                <Link to={`/team/members/${task.assignedTo.id}`} className="inline-block mt-3 text-sm text-blue-600 hover:underline">View Profile &rarr;</Link>
              </div>
            ) : <p className="text-sm text-slate-500 text-center">Not assigned</p>}
          </Section>

          <Section title="Execution Requirements" icon={Settings}>
            <div className="space-y-3">
              {[
                { key: "gps", label: "GPS Tracking", icon: MapPin },
                { key: "photo", label: "Photo Capture", icon: Camera },
                { key: "signature", label: "Digital Signature", icon: FileSignature },
                { key: "visitNotes", label: "Visit Notes", icon: FileText },
                { key: "invoice", label: "Generate Invoice", icon: DollarSign },
                { key: "payment", label: "Payment Collection", icon: DollarSign },
                { key: "checkIn", label: "Geo Check-In", icon: Map },
                { key: "checkOut", label: "Geo Check-Out", icon: Map },
                { key: "otp", label: "Customer Delivery OTP", icon: KeyRound },
              ].map((req) => {
                const isMet = req.key === 'otp'
                  ? (requirements.otp || requirements.requireOtp || metadata?.deliveryOtpVerified === true || task.status === 'CUSTOMER_OTP_VERIFIED')
                  : !!requirements[req.key];
                return (
                  <div key={req.key} className={`flex items-center justify-between p-2.5 rounded-lg ${isMet ? "bg-emerald-50" : "bg-slate-50"}`}>
                    <div className="flex items-center gap-2">
                      <req.icon size={14} className={isMet ? "text-emerald-600" : "text-slate-400"} />
                      <span className={`text-xs font-medium ${isMet ? "text-emerald-700" : "text-slate-500"}`}>{req.label}</span>
                    </div>
                    {isMet ? <Check size={14} className="text-emerald-600" /> : <XIcon size={14} className="text-slate-300" />}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Quick Actions" icon={Target}>
            <div className="space-y-3">
              <Link to={roleBasedBackLink()} className="block w-full text-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">View All Missions</Link>
              {task.assignedTo?.id && (
                <Link to={`/team/members/${task.assignedTo.id}`} className="block w-full text-center px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition">View Executive</Link>
              )}
            </div>
          </Section>

          <Section title="Reference" icon={Info}>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Reference Type</span><span className="font-medium text-slate-800">{task.referenceType || "-"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Reference ID</span><span className="font-medium text-slate-800 text-xs truncate max-w-[150px]">{task.referenceId || "-"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Priority</span><span className="font-medium text-slate-800">{task.priority || "-"}</span></div>
            </div>
          </Section>
        </div>
      </div>
    </motion.div>
  );
}