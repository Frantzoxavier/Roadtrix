'use client';

import { useQuery } from '@tanstack/react-query';
import { driversApi } from '@/services/api';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { Badge, LoadingPage } from '@/components/ui';
import { Mail, Phone, Star, CreditCard, CalendarDays, Truck, Hash } from 'lucide-react';
import { getInitials, getDriverStatusColor, formatDate } from '@/utils';

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function DriverProfilePage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['driver-me'],
    queryFn: () => driversApi.getMe(),
  });

  const driver = data?.data?.data || null;
  const profileUser = driver?.user || user;
  const fullName = `${profileUser?.firstName ?? ''} ${profileUser?.lastName ?? ''}`.trim();

  return (
    <AuthGuard>
      <DashboardLayout title="Profile">
        {isLoading ? (
          <LoadingPage />
        ) : (
          <div className="max-w-3xl space-y-5">
            {/* Identity card */}
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {getInitials(profileUser?.firstName ?? '?', profileUser?.lastName ?? '?')}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 truncate">{fullName || 'Driver'}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-500">Driver</span>
                    {driver?.status && <Badge className={getDriverStatusColor(driver.status)}>{driver.status}</Badge>}
                    {driver?.rating != null && (
                      <span className="flex items-center gap-1 text-sm text-amber-500 font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {driver.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Contact */}
              <div className="card p-6">
                <p className="section-title mb-2">Contact</p>
                <div className="divide-y divide-slate-100">
                  <Row icon={<Mail className="w-4 h-4" />} label="Email" value={profileUser?.email ?? '—'} />
                  <Row icon={<Phone className="w-4 h-4" />} label="Phone" value={profileUser?.phone ?? '—'} />
                </div>
              </div>

              {/* License & vehicle */}
              <div className="card p-6">
                <p className="section-title mb-2">License & vehicle</p>
                <div className="divide-y divide-slate-100">
                  <Row icon={<CreditCard className="w-4 h-4" />} label="License number" value={driver?.licenseNumber ?? '—'} />
                  {driver?.licenseExpiration && (
                    <Row icon={<CalendarDays className="w-4 h-4" />} label="License expires" value={formatDate(driver.licenseExpiration)} />
                  )}
                  <Row
                    icon={<Truck className="w-4 h-4" />}
                    label="Vehicle"
                    value={driver ? `${driver.vehicleMake} ${driver.vehicleModel} · ${driver.vehicleType}` : '—'}
                  />
                  <Row icon={<Hash className="w-4 h-4" />} label="Plate" value={driver?.plateNumber ?? '—'} />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 px-1">
              Need to update your details or status? Contact your dispatcher.
            </p>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
