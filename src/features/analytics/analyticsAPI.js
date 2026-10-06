import { api1, unwrap } from '../../api/axiosClient';

// GET /api/v1/analytics/category-analytics — Backend1, JWT, SA only
export const getCategoryAnalytics = (from, to) =>
  unwrap(api1.get('/api/v1/analytics/category-analytics', { params: { from, to } }));
