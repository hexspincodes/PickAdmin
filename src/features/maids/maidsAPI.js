import { api1, unwrap } from '../../api/axiosClient';
import { toFormData } from '../../utils/toFormData';

// GET /api/v1/job/all — Backend1, public, real pagination (page/limit/search/filter)
// filter: 'approved' | 'unapproved' | 'hired' | 'unhired'
export const getAllMaids = (page = 1, limit = 20, search = '', filter = '') =>
  unwrap(api1.get('/api/v1/job/all', { params: { page, limit, search, filter } }));

// GET /api/v1/job/ — Backend1, JWT, returns only status:0 (just-added / pending) apps, unpaginated
export const getPendingMaids = () => unwrap(api1.get('/api/v1/job/'));

// GET /api/v1/job/approved — Backend1, JWT, SA only
export const getApprovedMaids = () => unwrap(api1.get('/api/v1/job/approved'));

// POST /api/v1/job/id-dashboard — Backend1, JWT, SA/A, full profile for edit view
export const getMaidDashboard = (id) => unwrap(api1.post('/api/v1/job/id-dashboard', { id }));

// POST /api/v1/job/ — Backend1, JWT, SA/A, multipart/form-data create
export const createMaid = (fields) =>
  unwrap(api1.post('/api/v1/job/', toFormData(fields), { headers: { 'Content-Type': 'multipart/form-data' } }));

// PUT /api/v1/job/ — Backend1, JWT, SA/A, multipart/form-data update
export const updateMaid = (fields) =>
  unwrap(api1.put('/api/v1/job/', toFormData(fields), { headers: { 'Content-Type': 'multipart/form-data' } }));

// DELETE /api/v1/job/ — Backend1, JWT, SA only. Controller reads id from the query string.
export const deleteMaid = (id) => unwrap(api1.delete('/api/v1/job/', { params: { id } }));

// POST /api/v1/job/verify — Backend1, JWT, SA only. status: '1' verifies, '0' un-verifies.
export const setMaidVerified = (id, verified) =>
  unwrap(api1.post('/api/v1/job/verify', { id, status: verified ? '1' : '0' }));

// POST /api/v1/job/disabled — Backend1, JWT, SA/A. status: '1' disables, '0' re-enables.
export const setMaidDisabled = (id, disabled) =>
  unwrap(api1.post('/api/v1/job/disabled', { id, status: disabled ? '1' : '0' }));

// POST /api/v1/job/hire — Backend1, JWT, SA/A. status: '1' available, '0' not available.
export const setMaidAvailability = (id, available) =>
  unwrap(api1.post('/api/v1/job/hire', { id, status: available ? '1' : '0' }));

// POST /api/v1/job/assured — Backend1, JWT, SA/A. status: '1' assured, '0' not assured.
export const setMaidAssured = (id, assured) =>
  unwrap(api1.post('/api/v1/job/assured', { id, status: assured ? '1' : '0' }));

// GET /api/v1/job/counts — Backend1, public
export const getMaidCounts = () => unwrap(api1.get('/api/v1/job/counts'));

// GET /api/v1/admin/history/:maid_id — Backend1, JWT, SA only
export const getMaidHistory = (maidId) => unwrap(api1.get(`/api/v1/admin/history/${maidId}`));
