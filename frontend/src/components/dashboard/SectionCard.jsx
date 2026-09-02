import { motion } from "framer-motion";

export default function SectionCard({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600",
  action,
  children,
  className = "",
  hover = true,
  fullHeight = false,
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -3 } : undefined}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 ${
        fullHeight ? "h-full" : ""
      } ${className}`}
    >
      {(title || subtitle || Icon) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {Icon && <Icon size={20} className={`${iconColor} shrink-0 sm:w-6 sm:h-6`} />}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0 w-full sm:w-auto">{action}</div>}
        </div>
      )}
      {children}
    </motion.div>
  );
}

