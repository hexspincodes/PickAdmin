import { api2, unwrap } from '../../api/axiosClient';

// POST /api/v1/auth/admin/login — Backend2, public
export const loginAdmin = (email, password) =>
  unwrap(api2.post('/api/v1/auth/admin/login', { email, password }));

// POST /api/v1/auth/admin/logout — Backend2, JWT
export const logoutAdmin = () => unwrap(api2.post('/api/v1/auth/admin/logout'));

// POST /api/v1/auth/admin/register — Backend2, JWT, SA only
export const registerAdmin = (payload) =>
  unwrap(api2.post('/api/v1/auth/admin/register', payload));
