// src/lib/rbac.ts
import { UserRole } from './supabase';

export type { UserRole } from './supabase';

export type Permission = 
  | 'view_applications'
  | 'review_applications'
  | 'approve_applications'
  | 'issue_documents'
  | 'manage_staff'
  | 'manage_services'
  | 'view_all_applications'
  | 'verify_documents'
  | 'submit_applications'
  | 'make_payments';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  citizen: [
    'submit_applications',
    'view_applications',
    'verify_documents',
    'make_payments'
  ],

  staff: [
    'view_applications',
    'review_applications',
    'approve_applications',
    'issue_documents',
    'verify_documents'
  ],

  admin: [
    'view_all_applications',
    'view_applications',
    'review_applications',
    'approve_applications',
    'issue_documents',
    'manage_staff',
    'manage_services',
    'verify_documents'
  ],

  system: [
    'view_all_applications',
    'view_applications',
    'review_applications',
    'approve_applications',
    'issue_documents',
    'manage_staff',
    'manage_services',
    'verify_documents',
    'submit_applications',
    'make_payments'
  ]
};

export const hasPermission = (role: UserRole | undefined | null, permission: Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const hasAnyPermission = (role: UserRole | undefined | null, permissions: Permission[]): boolean => {
  if (!role) return false;
  return permissions.some(perm => hasPermission(role, perm));
};

export const canAccess = (role: UserRole | undefined | null, allowedRoles: UserRole[]): boolean => {
  if (!role) return false;
  return allowedRoles.includes(role);
};