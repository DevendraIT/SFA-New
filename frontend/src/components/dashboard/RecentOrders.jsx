import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";

const statusColors = {
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
  PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DELIVERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function RecentOrders({
  orders = [],
  emptyMessage = "No orders yet.",
  viewAllLink,
}) {
  return (
    <div>
      {!orders.length ? (
        <div className="py-10 text-center text-slate-500 text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Order Name
                </th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Real Price / Total
                </th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const amountVal = typeof order.totalAmount === "object" ? order.totalAmount?.amount : order.totalAmount;
                const formattedAmount = typeof order.totalAmount === "object" ? order.totalAmount?.formatted : `₹${Number(amountVal || order.amount || 0).toLocaleString("en-IN")}`;
                const orderNameDisplay = order.orderName || order.name || (order.orderNumber ? `Sales Order (${order.orderNumber})` : "Sales Order");

                return (
                  <motion.tr
                    key={order.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-slate-50 hover:bg-slate-50/80 transition"
                  >
                    <td className="py-3.5 px-2 font-bold text-slate-800 text-sm">
                      <span className="block text-slate-900">{orderNameDisplay}</span>
                      {order.orderNumber && (
                        <span className="text-xs font-mono text-blue-600 block">{order.orderNumber}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-sm text-slate-700">
                      {order.customer?.name || order.customerName || "-"}
                    </td>
                    <td className="py-3.5 px-2 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {formattedAmount}
                    </td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${
                          statusColors[order.status] || "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {order.status || "DRAFT"}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
