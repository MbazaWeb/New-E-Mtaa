import { useAuth } from '@/context/AuthContext';
import { hasPermission, hasAnyPermission, canAccess } from '@/lib/rbac';
import { Permission, UserRole } from '@/lib/rbac';

export const useRBAC = () => {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  return {
    role,
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    canAccess: (allowedRoles: UserRole[]) => canAccess(role, allowedRoles),
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
    isCitizen: role === 'citizen',
  };
};