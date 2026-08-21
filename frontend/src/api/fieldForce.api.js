import api from "./axios";

const BASE_URL = "/field-force";

const fieldForceApi = {
  // ---- Attendance (Disabled) ----
  checkIn() {
    return Promise.resolve({ data: { success: true, message: "Attendance endpoint disabled" } });
  },
  checkOut() {
    return Promise.resolve({ data: { success: true, message: "Attendance endpoint disabled" } });
  },
  getAttendance() {
    return Promise.resolve({ data: { success: true, data: null } });
  },
  listAttendance() {
    return Promise.resolve({ data: { success: true, data: { attendance: [], total: 0 } } });
  },
  getAttendanceSummary() {
    return Promise.resolve({ data: { success: true, data: { totalDays: 0, present: 0, absent: 0, leave: 0, halfday: 0 } } });
  },
  getTodayAttendance() {
    return Promise.resolve({ data: { success: true, data: null } });
  },

  // ---- Visits ----
  planVisit(data) {
    return api.post(`${BASE_URL}/visits`, data);
  },
  listVisits(params = {}) {
    return api.get(`${BASE_URL}/visits`, { params });
  },
  getVisit(id) {
    return api.get(`${BASE_URL}/visits/${id}`);
  },
  startVisit(id) {
    return api.post(`${BASE_URL}/visits/${id}/start`);
  },
  completeVisit(id, data) {
    return api.post(`${BASE_URL}/visits/${id}/complete`, data);
  },
  addVisitNotes(id, data) {
    return api.post(`${BASE_URL}/visits/${id}/notes`, data);
  },
  uploadPhoto(file) {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post(`${BASE_URL}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadVisitPhoto(id, data) {
    return api.post(`${BASE_URL}/visits/${id}/photo`, data);
  },

  // ---- Expenses ----
  logExpense(data) {
    return api.post(`${BASE_URL}/expenses`, data);
  },
  listExpenses(params = {}) {
    return api.get(`${BASE_URL}/expenses`, { params });
  },
  getExpense(id) {
    return api.get(`${BASE_URL}/expenses/${id}`);
  },
  approveExpense(id) {
    return api.patch(`${BASE_URL}/expenses/${id}/approve`);
  },
  rejectExpense(id) {
    return api.patch(`${BASE_URL}/expenses/${id}/reject`);
  },

  // ---- Daily Activity Reports ----
  generateDar(data) {
    return api.post(`${BASE_URL}/dar`, data);
  },
  listDars(params = {}) {
    return api.get(`${BASE_URL}/dar`, { params });
  },
  getDar(id) {
    return api.get(`${BASE_URL}/dar/${id}`);
  },
  submitDar(id) {
    return api.patch(`${BASE_URL}/dar/${id}/submit`);
  },
  approveDar(id) {
    return api.patch(`${BASE_URL}/dar/${id}/approve`);
  },

  // ---- Tasks ----
  createTask(data) {
    return api.post(`${BASE_URL}/tasks`, data);
  },
  listTasks(params = {}) {
    return api.get(`${BASE_URL}/tasks`, { params });
  },
  getTask(id) {
    return api.get(`${BASE_URL}/tasks/${id}`);
  },
  getTaskRoute(id, userLocation = {}) {
    const params = {};
    if (userLocation?.lat != null && userLocation?.lng != null) {
      params.lat = userLocation.lat;
      params.lng = userLocation.lng;
    } else if (userLocation?.latitude != null && userLocation?.longitude != null) {
      params.lat = userLocation.latitude;
      params.lng = userLocation.longitude;
    } else if (typeof userLocation === "object") {
      Object.assign(params, userLocation);
    }
    return api.get(`${BASE_URL}/tasks/${id}/route`, { params });
  },
  updateTaskStatus(id, data) {
    return api.patch(`${BASE_URL}/tasks/${id}/status`, data);
  },
  completeTask(id, data = {}) {
    return api.patch(`${BASE_URL}/tasks/${id}/complete`, data);
  },
  sendDeliveryOtp(id) {
    return api.post(`${BASE_URL}/tasks/${id}/send-delivery-otp`);
  },
  verifyDeliveryOtp(id, data) {
    return api.post(`${BASE_URL}/tasks/${id}/verify-delivery-otp`, data);
  },

  // ---- Beat Plans ----
  createBeatPlan(data) {
    return api.post(`${BASE_URL}/beat-plans`, data);
  },
  assignBeatPlan(data) {
    return api.post(`${BASE_URL}/beat-plans/assign`, data);
  },
  listBeatPlans(params = {}) {
    return api.get(`${BASE_URL}/beat-plans`, { params });
  },
  getBeatPlan(id) {
    return api.get(`${BASE_URL}/beat-plans/${id}`);
  },
  approveBeatPlan(id) {
    return api.post(`${BASE_URL}/beat-plans/${id}/approve`);
  },

  // ---- Calendar ----
  createCalendarEvent(data) {
    return api.post(`${BASE_URL}/calendar`, data);
  },
  listCalendarEvents(params = {}) {
    return api.get(`${BASE_URL}/calendar`, { params });
  },
  getCalendarEvent(id) {
    return api.get(`${BASE_URL}/calendar/${id}`);
  },

  // ---- Route ----
  optimizeRoute(data) {
    return api.post(`${BASE_URL}/route/optimize`, data);
  },

  // ---- Analytics ----
  getAnalyticsAttendance() {
    return Promise.resolve({ data: { success: true, data: { totalDays: 0, present: 0, absent: 0, leave: 0, halfday: 0 } } });
  },
  getAnalyticsVisits(params = {}) {
    return api.get(`${BASE_URL}/analytics/visits`, { params });
  },
  getAnalyticsExpenses(params = {}) {
    return api.get(`${BASE_URL}/analytics/expenses`, { params });
  },
};

export default fieldForceApi;

