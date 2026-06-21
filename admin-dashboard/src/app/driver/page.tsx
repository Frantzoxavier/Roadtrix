'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadsApi, driversApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { Badge, LoadingPage, EmptyState, StatCard, Spinner, Toast } from '@/components/ui';
import { Package, Navigation, CheckCircle2, Clock, MapPin, ArrowRight, Truck } from 'lucide-react';
import { formatCurrency, formatWeight, getLoadStatusColor, getLoadStatusLabel } from '@/utils';

const IN_PROGRESS = ['ACCEPTED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DELIVERY'];
const DONE = ['DELIVERED', 'COMPLETED'];

export default function MyLoadsPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState('');

  const { data: loadsRes, isLoading } = useQuery({
    queryKey: ['driver-loads'],
    queryFn: () => loadsApi.getAll({ limit: '50' }),
  });
  const { data: activeRes } = useQuery({
    queryKey: ['driver-active-load'],
    queryFn: () => driversApi.getActiveLoad(),
  });

  const loads: any[] = loadsRes?.data?.data || [];
  const active = activeRes?.data?.data || null;

  const counts = {
    assigned: loads.filter((l) => l.status === 'ASSIGNED').length,
    inProgress: loads.filter((l) => IN_PROGRESS.includes(l.status)).length,
    completed: loads.filter((l) => DONE.includes(l.status)).length,
  };

  const onActionSuccess = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ['driver-loads'] });
    queryClient.invalidateQueries({ queryKey: ['driver-active-load'] });
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const acceptM = useMutation({
    mutationFn: (id: string) => loadsApi.accept(id),
    onSuccess: () => onActionSuccess('Load accepted — head to pickup!'),
  });
  const declineM = useMutation({
    mutationFn: (id: string) => loadsApi.decline(id),
    onSuccess: () => onActionSuccess('Load declined.'),
  });
  const busy = acceptM.isPending || declineM.isPending;

  return (
    <AuthGuard>
      <DashboardLayout title="My Loads">
        <div className="space-y-5">
          {toast && (
            <div className="fixed top-4 right-4 z-50">
              <Toast message={toast} type="success" onClose={() => setToast('')} />
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Assigned to you" value={counts.assigned} icon={<Package className="w-5 h-5" />} />
            <StatCard title="In progress" value={counts.inProgress} icon={<Navigation className="w-5 h-5" />} />
            <StatCard title="Completed" value={counts.completed} icon={<CheckCircle2 className="w-5 h-5" />} />
          </div>

          {/* Active trip banner */}
          {active?.load && (
            <Link href="/driver/trip" className="block">
              <div className="card p-5 border-accent/30 bg-accent/5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-accent uppercase tracking-wider">Active trip</p>
                      <p className="font-semibold text-slate-900 truncate">
                        {active.load.pickupAddress} → {active.load.deliveryAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge className={getLoadStatusColor(active.load.status)}>{getLoadStatusLabel(active.load.status)}</Badge>
                    <ArrowRight className="w-4 h-4 text-accent" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Loads list */}
          {isLoading ? (
            <LoadingPage />
          ) : loads.length === 0 ? (
            <EmptyState
              icon={<Package className="w-12 h-12" />}
              title="No loads yet"
              description="When dispatch assigns you a load, it'll show up here."
            />
          ) : (
            <div className="space-y-3">
              {loads.map((load) => (
                <div key={load.id} className="card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getLoadStatusColor(load.status)}>{getLoadStatusLabel(load.status)}</Badge>
                        <span className="text-xs text-slate-400">#{load.externalLoadId}</span>
                      </div>
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {load.pickupAddress} <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> {load.deliveryAddress}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {load.loadType} · {formatWeight(load.weight)} · <span className="font-semibold text-accent">{formatCurrency(load.driverPayout)}</span>
                      </p>
                    </div>

                    {/* Inline actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {load.status === 'ASSIGNED' ? (
                        <>
                          <button onClick={() => declineM.mutate(load.id)} disabled={busy} className="btn-secondary text-sm">
                            Decline
                          </button>
                          <button onClick={() => acceptM.mutate(load.id)} disabled={busy} className="btn-primary text-sm">
                            {acceptM.isPending ? <Spinner size="sm" /> : 'Accept'}
                          </button>
                        </>
                      ) : IN_PROGRESS.includes(load.status) ? (
                        <Link href="/driver/trip" className="btn-primary text-sm">
                          Open trip <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : DONE.includes(load.status) ? (
                        <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Done
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Clock className="w-4 h-4" /> {getLoadStatusLabel(load.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
