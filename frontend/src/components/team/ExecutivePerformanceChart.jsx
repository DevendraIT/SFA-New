import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#22C55E", "#F59E0B", "#F97316", "#EF4444"];

export default function ExecutivePerformanceChart({ taskSummary, visitSummary, loading = false }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-[250px] bg-slate-100 rounded-xl" />
        <div className="h-4 w-40 bg-slate-200 rounded mx-auto" />
      </div>
    );
  }

  const taskData = [
    { name: "Completed", value: taskSummary?.completed || 0 },
    { name: "In Progress", value: taskSummary?.inProgress || 0 },
    { name: "Pending", value: taskSummary?.pending || 0 },
    { name: "Cancelled", value: taskSummary?.cancelled || 0 },
  ].filter((d) => d.value > 0);

  const visitData = [
    { name: "Completed", visits: visitSummary?.completed || 0 },
    { name: "Planned", visits: visitSummary?.planned || 0 },
    { name: "In Progress", visits: visitSummary?.inProgress || 0 },
    { name: "Cancelled", visits: visitSummary?.cancelled || 0 },
  ];

  return (
    <div className="space-y-8">
      {taskData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Task Status Distribution</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={taskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={4}>
                {taskData.map((_entry, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Visit Status Overview</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={visitData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="visits" fill="#F97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
