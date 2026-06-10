// src/hooks/index.ts
// Clean imports for all custom hooks

export { useSupabaseRealtime } from './useSupabaseRealtime';

// Add more hooks here as you create them
// Example:
// export { useApplications } from './useApplications';
// export { useNotifications } from './useNotifications';
// export { usePresence } from './usePresence';

// Common query keys (recommended for consistency)
export const QueryKeys = {
  // Dashboard
  dashboard: ['admin-dashboard-stats'],
  recentActivities: ['recent-activities'],

  // Logs
  adminLogs: (page: number, filters?: any) => ['admin-logs', page, filters],

  // Applications
  applications: (userId?: string) => ['applications', userId],
  myApplications: (userId: string) => ['my-applications', userId],

  // Users
  users: ['users'],
  citizenManagement: ['citizens'],

  // Services
  services: ['services'],
  serviceCategories: ['service-categories'],

  // Locations
  regions: ['regions'],
  districts: (region?: string) => ['districts', region],

  // Auth / Profile
  currentUser: ['current-user'],
  userProfile: (userId: string) => ['user-profile', userId],
} as const;