// Mirrors Backend1's src/models/users/admin.model.js role enum.
export const ROLES = {
  SA: 'SA',
  A: 'A',
  MARKETING: 'Marketing',
};

export const ROLE_LABELS = {
  SA: 'Super Admin',
  A: 'Admin',
  Marketing: 'Marketing',
};

export const hasRole = (userRole, allowed) => allowed.includes(userRole);
