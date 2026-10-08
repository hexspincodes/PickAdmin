import { api1, unwrap } from '../../api/axiosClient';

// Backend1 returns a fixed 100 customers per page (it ignores any `limit` param)
export const CUSTOMERS_PAGE_SIZE = 100;

// GET /api/v1/admin/customer — Backend1, JWT, SA only, paginated
export const getCustomers = (page = 1, search = '') =>
  unwrap(api1.get('/api/v1/admin/customer', { params: { page, search } }));

// PUT /api/v1/admin/customer-password — Backend1, JWT, SA only
export const updateCustomerPassword = (user_id, password) =>
  unwrap(api1.put('/api/v1/admin/customer-password', { user_id, password }));

// GET /api/v1/admin/block-user/:user_id — Backend1, JWT, SA only (state-changing GET, by design)
export const toggleUserBlock = (user_id) => unwrap(api1.get(`/api/v1/admin/block-user/${user_id}`));

// POST /api/v1/admin/verify-payment — Backend1, JWT, SA only (proxies to Backend2)
export const verifyCustomerPayment = (user_id, transRef) =>
  unwrap(api1.post('/api/v1/admin/verify-payment', { user_id, transRef }));
