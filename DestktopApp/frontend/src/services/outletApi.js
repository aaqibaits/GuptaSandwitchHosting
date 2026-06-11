import api from './api';

// ============================================
// OUTLET MANAGEMENT
// ============================================

// Fetch all outlets (with nested users)
export const fetchOutlets = async () => api.get('/outlets').then(res => res.data);

// Fetch consolidated dashboard statistics across active outlets
export const fetchOutletDashboardStats = async () => api.get('/outlets/dashboard/stats').then(res => res.data);

// Add a new outlet
export const addOutlet = async (outletData) => api.post('/outlets/add-outlet', outletData).then(res => res.data);

// Update outlet details
export const updateOutlet = async (id, outletData) => api.put(`/outlets/${id}`, outletData).then(res => res.data);

// Update outlet login credentials
export const updateOutletCredentials = async (id, credentials) => api.put(`/outlets/${id}/credentials`, credentials).then(res => res.data);

// Toggle outlet status (active/inactive)
export const toggleOutletStatus = async (id, status) => api.put(`/outlets/${id}/status`, { status }).then(res => res.data);

// Delete an outlet
export const deleteOutlet = async (id) => api.delete(`/outlets/${id}`).then(res => res.data);

// ============================================
// USER MANAGEMENT (Staff users within outlets)
// ============================================

// Add a staff user to an outlet
export const addUser = async (outletId, userData) => api.post(`/outlets/${outletId}/users`, userData).then(res => res.data);

// Update a staff user
export const updateUser = async (outletId, userId, userData) => api.put(`/outlets/${outletId}/users/${userId}`, userData).then(res => res.data);

// Toggle user status
export const toggleUserStatus = async (outletId, userId, status) => api.put(`/outlets/${outletId}/users/${userId}/status`, { status }).then(res => res.data);

// Delete a staff user
export const deleteUser = async (outletId, userId) => api.delete(`/outlets/${outletId}/users/${userId}`).then(res => res.data);