import { api1, unwrap } from '../../api/axiosClient';
import { toFormData } from '../../utils/toFormData';

// GET /api/v1/job/findjob — Backend1, JWT, SA/A
export const getJobListings = () => unwrap(api1.get('/api/v1/job/findjob'));

// POST /api/v1/job/findjob — Backend1, JWT, SA/A. multipart — the controller only picks up
// an image file from req.files.image, and the model requires one.
export const createJobListing = (fields) =>
  unwrap(api1.post('/api/v1/job/findjob', toFormData(fields), { headers: { 'Content-Type': 'multipart/form-data' } }));

// DELETE /api/v1/job/findjob — Backend1, JWT, SA only. Controller reads id from the query string.
export const deleteJobListing = (id) => unwrap(api1.delete('/api/v1/job/findjob', { params: { id } }));
