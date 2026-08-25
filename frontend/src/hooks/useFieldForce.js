import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import fieldForceApi from "../api/fieldForce.api";
import dayjs from "dayjs";

function safeArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    if (Array.isArray(value.visits)) return value.visits;
    if (Array.isArray(value.tasks)) return value.tasks;
    if (Array.isArray(value.expenses)) return value.expenses;
    if (Array.isArray(value.dars)) return value.dars;
    if (Array.isArray(value.plans)) return value.plans;
    if (Array.isArray(value.events)) return value.events;
    if (Array.isArray(value.attendance)) return value.attendance;
    // If it's a plain object with numeric keys, convert to array
    const vals = Object.values(value);
    if (vals.length > 0 && typeof vals[0] === 'object') return vals;
  }
  return [];
}

function safeExtract(res) {
  if (!res?.value) return null;
  const body = res.value.data;
  if (!body) return null;
  if (body.data !== undefined && body.data !== null) return body.data;
  if (body.message && typeof body.message === "object") return body.message;
  return body;
}

export default function useFieldForce(userId) {
  const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
  const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["fieldForceData", userId, startOfMonth, endOfMonth],
    queryFn: async () => {
      const results = await Promise.allSettled([
        fieldForceApi.getTodayAttendance().catch(() => ({ data: null })),
        fieldForceApi.listAttendance({ startDate: startOfMonth, endDate: endOfMonth, take: 50 }).catch(() => ({ data: { attendance: [] } })),
        fieldForceApi.listVisits({ take: 50 }).catch(() => ({ data: { visits: [] } })),
        fieldForceApi.listTasks({ assignedToId: userId, take: 50 }).catch(() => ({ data: { tasks: [] } })),
        fieldForceApi.listExpenses({ take: 50 }).catch(() => ({ data: { expenses: [] } })),
        fieldForceApi.listDars({ take: 50 }).catch(() => ({ data: { dars: [] } })),
        fieldForceApi.listBeatPlans({ take: 50 }).catch(() => ({ data: { plans: [] } })),
        fieldForceApi.listCalendarEvents({ startDate: startOfMonth, endDate: endOfMonth, take: 50 }).catch(() => ({ data: { events: [] } })),
        fieldForceApi.getAttendanceSummary({ startDate: startOfMonth, endDate: endOfMonth }).catch(() => ({ data: null })),
        fieldForceApi.getAnalyticsVisits({ startDate: startOfMonth, endDate: endOfMonth }).catch(() => ({ data: null })),
        fieldForceApi.getAnalyticsExpenses({ startDate: startOfMonth, endDate: endOfMonth }).catch(() => ({ data: null })),
      ]);

      const visitsArr = safeArray(safeExtract(results[2]));
      const todayStr = dayjs().format("YYYY-MM-DD");

      return {
        todayAttendance: safeExtract(results[0]) ?? null,
        attendanceHistory: safeArray(safeExtract(results[1])),
        visits: visitsArr,
        todayVisits: visitsArr.filter((v) => v?.scheduledAt && dayjs(v.scheduledAt).format("YYYY-MM-DD") === todayStr),
        tasks: safeArray(safeExtract(results[3])),
        expenses: safeArray(safeExtract(results[4])),
        dars: safeArray(safeExtract(results[5])),
        beatPlans: safeArray(safeExtract(results[6])),
        calendarEvents: safeArray(safeExtract(results[7])),
        attendanceSummary: safeExtract(results[8]) ?? null,
        visitsSummary: safeExtract(results[9]) ?? null,
        expenseSummary: safeExtract(results[10]) ?? null,
      };
    },
    staleTime: 30 * 1000, // 30s cache
    gcTime: 5 * 60 * 1000,
  });

  const visits = data?.visits || [];
  const tasks = data?.tasks || [];
  const expenses = data?.expenses || [];
  const dars = data?.dars || [];

  const visitSummary = useMemo(() => {
    const v = Array.isArray(visits) ? visits : [];
    return {
      total: v.length,
      completed: v.filter((x) => x?.status === "COMPLETED").length,
      planned: v.filter((x) => x?.status === "PLANNED").length,
      inProgress: v.filter((x) => x?.status === "IN_PROGRESS").length,
      cancelled: v.filter((x) => x?.status === "CANCELLED").length,
    };
  }, [visits]);

  const taskSummary = useMemo(() => {
    const t = Array.isArray(tasks) ? tasks : [];
    const total = t.length;
    const completed = t.filter((x) => x?.status === "COMPLETED").length;
    return {
      total,
      pending: t.filter((x) => x?.status === "PENDING").length,
      inProgress: t.filter((x) => x?.status === "IN_PROGRESS").length,
      completed,
      cancelled: t.filter((x) => x?.status === "CANCELLED").length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  const expenseSummaryData = useMemo(() => {
    const e = Array.isArray(expenses) ? expenses : [];
    return {
      total: e.length,
      pending: e.filter((x) => x?.status === "PENDING").length,
      approved: e.filter((x) => x?.status === "APPROVED").length,
      rejected: e.filter((x) => x?.status === "REJECTED").length,
      totalAmount: e.reduce((sum, x) => sum + (x?.amount || 0), 0),
    };
  }, [expenses]);

  const darSummary = useMemo(() => {
    const d = Array.isArray(dars) ? dars : [];
    return {
      total: d.length,
      draft: d.filter((x) => x?.status === "DRAFT").length,
      submitted: d.filter((x) => x?.status === "SUBMITTED").length,
      approved: d.filter((x) => x?.status === "APPROVED").length,
    };
  }, [dars]);

  return {
    todayAttendance: data?.todayAttendance ?? null,
    attendanceHistory: data?.attendanceHistory || [],
    todayVisits: data?.todayVisits || [],
    visits,
    tasks,
    expenses,
    dars,
    beatPlans: data?.beatPlans || [],
    calendarEvents: data?.calendarEvents || [],
    loading: isLoading,
    error,
    refresh: refetch,
    visitSummary,
    taskSummary,
    expenseSummary: expenseSummaryData,
    darSummary,
    attendanceSummary: data?.attendanceSummary ?? null,
    visitsSummary: data?.visitsSummary ?? null,
    expenseAnalytics: data?.expenseSummary ?? null,
  };
}

