import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading data. Please try again.",
  onRetry,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <div className="h-20 w-20 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
        <AlertTriangle size={40} className="text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onRetry();
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-all shadow-sm"
        >
          <RefreshCcw size={16} />
          Try Again
        </button>
      )}
    </motion.div>
  );
}

