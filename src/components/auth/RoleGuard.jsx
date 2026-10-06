import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

/** Wrap a page element: <RoleGuard allowed={['SA']}><TeamPage /></RoleGuard> */
export default function RoleGuard({ allowed, children }) {
  const { user } = useSelector((state) => state.auth);

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
