import { api1, unwrap } from '../../api/axiosClient';
import { registerAdmin } from '../auth/authAPI';

// GET /api/v1/admin/team — Backend1, JWT, SA only
export const getTeamMembers = () => unwrap(api1.get('/api/v1/admin/team'));

// DELETE /api/v1/admin/team-member/:id — Backend1, JWT, SA only
export const deleteTeamMember = (id) => unwrap(api1.delete(`/api/v1/admin/team-member/${id}`));

// PATCH /api/v1/admin/team-member/:id — Backend1, JWT, SA only
export const changeTeamMemberRole = (id, role) =>
  unwrap(api1.patch(`/api/v1/admin/team-member/${id}`, { role }));

// POST /api/v1/auth/admin/register — Backend2, JWT, SA only
export const createTeamMember = (payload) => registerAdmin(payload);
