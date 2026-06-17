export const Colors = {
  primary: '#0F172A',
  accent: '#2563EB',
  accentLight: '#EFF6FF',
  accentDark: '#1D4ED8',
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',

  // Neutrals
  white: '#FFFFFF',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',

  // Status colors
  statusOpen: '#64748B',
  statusAssigned: '#2563EB',
  statusAccepted: '#4F46E5',
  statusEnRoutePickup: '#D97706',
  statusPickedUp: '#EA580C',
  statusEnRouteDelivery: '#9333EA',
  statusDelivered: '#16A34A',
  statusCompleted: '#059669',
  statusCancelled: '#DC2626',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export function getLoadStatusColor(status: string): string {
  const map: Record<string, string> = {
    OPEN: Colors.statusOpen,
    ASSIGNED: Colors.statusAssigned,
    ACCEPTED: Colors.statusAccepted,
    EN_ROUTE_PICKUP: Colors.statusEnRoutePickup,
    PICKED_UP: Colors.statusPickedUp,
    EN_ROUTE_DELIVERY: Colors.statusEnRouteDelivery,
    DELIVERED: Colors.statusDelivered,
    COMPLETED: Colors.statusCompleted,
    CANCELLED: Colors.statusCancelled,
  };
  return map[status] || Colors.textMuted;
}

export function getLoadStatusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'Open',
    ASSIGNED: 'Assigned to You',
    ACCEPTED: 'Accepted',
    EN_ROUTE_PICKUP: 'En Route to Pickup',
    PICKED_UP: 'Cargo Picked Up',
    EN_ROUTE_DELIVERY: 'En Route to Delivery',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return map[status] || status;
}
