import { api1, unwrap } from '../../api/axiosClient';

// GET /api/v1/skills/ — Backend1, public, active skills only
export const getActiveSkills = () => unwrap(api1.get('/api/v1/skills/'));

// GET /api/v1/skills/admin — Backend1, JWT, SA/A, includes inactive skills
export const getAllSkills = () => unwrap(api1.get('/api/v1/skills/admin'));

// POST /api/v1/skills/ — Backend1, JWT, SA/A. Body: { name, is_active? }
export const createSkill = (payload) => unwrap(api1.post('/api/v1/skills/', payload));

// PATCH /api/v1/skills/:id — Backend1, JWT, SA/A. Body: { name?, is_active? }.
// A rename is also applied to every maid profile that had the old name.
export const updateSkill = (id, payload) => unwrap(api1.patch(`/api/v1/skills/${id}`, payload));

// DELETE /api/v1/skills/:id — Backend1, JWT, SA/A. Maid profiles keep the skill;
// the response's data.maidsUsing says how many still list it.
export const deleteSkill = (id) => unwrap(api1.delete(`/api/v1/skills/${id}`));

// PUT /api/v1/skills/order — Backend1, JWT, SA/A. ids: every skill's _id in display order
// (a partial or stale list is refused with 409). Returns { skills } in the new order.
export const reorderSkills = (ids) => unwrap(api1.put('/api/v1/skills/order', { ids }));

// Same endpoint with { reset: true }: forget the custom order, back to A–Z.
export const resetSkillOrder = () => unwrap(api1.put('/api/v1/skills/order', { reset: true }));
