import { api2, unwrap } from '../../api/axiosClient';

// GET /api/v1/payment/coupons/ — Backend2, JWT, SA only. Each coupon has times_used.
export const getCoupons = () => unwrap(api2.get('/api/v1/payment/coupons/'));

// POST /api/v1/payment/coupons/ — Backend2, JWT, SA only.
// Body: { code, discount_percent, is_active?, expires_at?, once_per_customer? }
export const createCoupon = (payload) => unwrap(api2.post('/api/v1/payment/coupons/', payload));

// PATCH /api/v1/payment/coupons/:id — Backend2, JWT, SA only. Any subset of the create fields.
export const updateCoupon = (id, payload) => unwrap(api2.patch(`/api/v1/payment/coupons/${id}`, payload));

// DELETE /api/v1/payment/coupons/:id — Backend2, JWT, SA only. Past payments keep their discount.
export const deleteCoupon = (id) => unwrap(api2.delete(`/api/v1/payment/coupons/${id}`));
