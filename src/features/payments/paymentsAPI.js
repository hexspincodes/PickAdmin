import { api2, unwrap } from '../../api/axiosClient';

// GET /api/v1/payment/ — Backend2, JWT, SA only, paginated
export const getPayments = (page = 1, limit = 10, search = '') =>
  unwrap(api2.get('/api/v1/payment/', { params: { page, limit, search } }));

// POST /api/v1/payment/manual-verify — Backend2, no auth gate on the API side, gated here by role UI
export const manualVerifyPayment = (user_id) =>
  unwrap(api2.post('/api/v1/payment/manual-verify', { user_id }));
