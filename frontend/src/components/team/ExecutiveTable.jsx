import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";

export default function ExecutiveTable({ executives = [], loading = false }) {

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-28 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!executives.length) {
    return <div className="py-12 text-center text-slate-500 text-sm">No team members found.</div>;
  }

  return (
    <div className="space-y-3">
      {executives.map((exec, index) => {
        const fullName = `${exec.firstName || ""} ${exec.lastName || ""}`.trim();
        return (
          <motion.div
            key={exec.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 transition-all"
          >
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {fullName.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{fullName}</p>
              <div className="flex items-center gap-3 mt-0.5">
                {exec.email && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Mail size={12} />
                    <span className="truncate">{exec.email}</span>
                  </span>
                )}
                {exec.phoneNumber && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Phone size={12} />
                    {exec.phoneNumber}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
