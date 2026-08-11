import { motion } from "framer-motion";
import { Calendar, User, Clock, ChevronRight, MapPin, ShoppingCart, Building2, Package, Route } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import TaskStatusBadge, { PriorityBadge } from "./TaskStatusBadge";

import { useAuth } from "../../context/AuthContext";
import { isSalesExecutiveUser } from "../../utils/roleUtils";

export default function TaskCard({ task, index = 0 }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Guard against undefined task (e.g. during loading skeleton)
  if (!task) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
        <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
      </div>
    );
  }

  const isOverdue =
    task.dueDate &&
    task.status !== "COMPLETED" &&
    dayjs(task.dueDate).isBefore(dayjs());

  const metadata = task.metadata || {};
  const customer = metadata.customer;
  const order = metadata.order;
  const products = metadata.products || [];
  const route = metadata.route;
  const requirements = metadata.requirements || {};
  const category = metadata.category;

  const handleClick = () => {
    // Only Sales Executive executing their task in field-force enters execution workflow
    if (isSalesExecutiveUser(user) && window.location.pathname.startsWith("/field-force")) {
      navigate(`/field-force/tasks/${task.id}/execute`);
    } else {
      // Super Admin, Company Admin, Sales Manager go to administrative task detail
      navigate(`/team/tasks/${task.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -3 }}
      onClick={handleClick}
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {category && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-100 text-purple-700 uppercase">
                {category.replace(/_/g, " ")}
              </span>
            )}
            {requirements.gps && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 text-blue-700">
                GPS
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-900 text-sm truncate">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <ChevronRight size={18} className="text-slate-400 flex-shrink-0 mt-1" />
      </div>

      {customer && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <Building2 size={12} className="text-blue-500" />
          <span className="truncate">{customer.name}</span>
        </div>
      )}
      {order && (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
          <ShoppingCart size={12} className="text-emerald-500" />
          <span className="truncate">{order.orderNumber}</span>
        </div>
      )}
      {products.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
          <Package size={12} className="text-amber-500" />
          <span>{products.length} product(s)</span>
        </div>
      )}
      {route && (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
          <Route size={12} className="text-indigo-500" />
          <span className="truncate">{route.beatPlanTitle || route.startLocation || "Route"}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <TaskStatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        {isOverdue && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            Overdue
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
        {task.assignedTo && (
          <div className="flex items-center gap-1.5">
            <User size={14} />
            <span>
              {task.assignedTo.firstName} {task.assignedTo.lastName}
            </span>
          </div>
        )}
        {task.dueDate && (
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>{dayjs(task.dueDate).format("MMM D, YYYY")}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>{dayjs(task.createdAt).format("MMM D")}</span>
        </div>
      </div>
    </motion.div>
  );
}

