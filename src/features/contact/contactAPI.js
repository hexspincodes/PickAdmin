import { api1, unwrap } from '../../api/axiosClient';

// GET /api/v1/contact/ — Backend1, JWT, SA/A
export const getContacts = () => unwrap(api1.get('/api/v1/contact/'));

// DELETE /api/v1/contact/:id — Backend1, JWT, SA/A
export const deleteContact = (id) => unwrap(api1.delete(`/api/v1/contact/${id}`));
