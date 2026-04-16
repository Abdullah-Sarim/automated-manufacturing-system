import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getProfile = () => API.get('/auth/profile');
export const changePassword = (currentPassword, newPassword) => API.put('/auth/password', { currentPassword, newPassword });

export const getDealers = () => API.get('/dealers');
export const createDealer = (data) => API.post('/dealers', data);
export const updateDealer = (id, data) => API.put('/dealers/' + id, data);
export const deleteDealer = (id) => API.delete('/dealers/' + id);
export const getMyDealerProfile = () => API.get('/dealers/my-profile');
export const updateMyDealerProfile = (data) => API.put('/dealers/my-profile', data);
export const deleteMyDealerAccount = () => API.delete('/dealers/my-profile');

export const getSuppliers = () => API.get('/suppliers');
export const createSupplier = (data) => API.post('/suppliers', data);
export const updateSupplier = (id, data) => API.put('/suppliers/' + id, data);
export const deleteSupplier = (id) => API.delete('/suppliers/' + id);
export const getMySupplierProfile = () => API.get('/suppliers/my-profile');
export const updateMySupplierProfile = (data) => API.put('/suppliers/my-profile', data);
export const deleteMySupplierAccount = () => API.delete('/suppliers/my-profile');

export const getProducts = () => API.get('/products');
export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put('/products/' + id, data);
export const updateProductStock = (id, data) => API.put('/products/' + id + '/stock', data);
export const deleteProduct = (id) => API.delete('/products/' + id);
export const getLowStockProducts = () => API.get('/products/low-stock/alerts');

export const getMaterials = () => API.get('/materials');
export const createMaterial = (data) => API.post('/materials', data);
export const updateMaterial = (id, data) => API.put('/materials/' + id, data);
export const updateMaterialStock = (id, data) => API.put('/materials/' + id + '/stock', data);
export const deleteMaterial = (id) => API.delete('/materials/' + id);
export const getLowStockMaterials = () => API.get('/materials/low-stock/alerts');

export const getOrders = () => API.get('/orders');
export const getOrder = (id) => API.get('/orders/' + id);
export const createOrder = (data) => API.post('/orders', data);
export const createBulkOrders = (data) => API.post('/orders/bulk', data);
export const generateBill = (id, data) => API.put('/orders/' + id + '/generate-bill', data);
export const updateOrder = (id, data) => API.put('/orders/' + id, data);
export const deleteOrder = (id) => API.delete('/orders/' + id);

export const getQuotations = () => API.get('/quotations');
export const getQuotation = (id) => API.get('/quotations/' + id);
export const createQuotation = (data) => API.post('/quotations', data);
export const respondQuotation = (id, data) => API.put('/quotations/' + id + '/respond', data);
export const approveQuotation = (id) => API.put('/quotations/' + id + '/approve');
export const rejectQuotation = (id) => API.put('/quotations/' + id + '/reject');
export const deleteQuotation = (id) => API.delete('/quotations/' + id);
export const compareQuotations = (materialId) => API.get('/quotations/compare/material/' + materialId);
export const generateSupplierBill = (id, data) => API.put('/quotations/' + id + '/generate-bill', data);

export const getManufacturingOrders = () => API.get('/manufacturing');
export const getManufacturingOrder = (id) => API.get('/manufacturing/' + id);
export const createManufacturingOrder = (data) => API.post('/manufacturing', data);
export const startManufacturing = (id, data = {}) => API.put('/manufacturing/' + id + '/start', data);
export const completeManufacturing = (id) => API.put('/manufacturing/' + id + '/complete');
export const updateManufacturingOrder = (id, data) => API.put('/manufacturing/' + id, data);

export const getBills = () => API.get('/bills');
export const getBill = (id) => API.get('/bills/' + id);
export const createBill = (data) => API.post('/bills', data);
export const updateBill = (id, data) => API.put('/bills/' + id, data);
export const payBill = (id) => API.put('/bills/' + id + '/pay');
export const deleteBill = (id) => API.delete('/bills/' + id);

export const getDashboard = () => API.get('/reports/dashboard');
export const getSalesReport = (period) => API.get('/reports/sales?period=' + period);
export const getStockReport = () => API.get('/reports/stock');
export const getSupplierReport = () => API.get('/reports/supplier');
export const getPredictions = () => API.get('/reports/predictions');

export const getNotifications = () => API.get('/notifications');
export const getUnreadCount = () => API.get('/notifications/unread');
export const markAsRead = (id) => API.put('/notifications/' + id + '/read');
export const markAllAsRead = () => API.put('/notifications/read-all');

export const getPendingUsers = () => API.get('/users/pending');
export const approveUser = (id) => API.put('/users/' + id + '/approve');
export const rejectUser = (id) => API.put('/users/' + id + '/reject', {});
export const getAllUsers = () => API.get('/users/users');
export const getManagers = () => API.get('/users/managers');
export const deleteManager = (id) => API.delete('/users/' + id);
export const resetData = (password) => API.post('/users/reset-data', { password: password });

export default API;