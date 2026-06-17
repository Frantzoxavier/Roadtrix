'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadsApi, driversApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { Badge, LoadingPage, Modal, Spinner, ConfirmDialog } from '@/components/ui';
import {
  ArrowLeft, MapPin, Package, Truck, DollarSign,
  User, Calendar, FileText, CheckCircle,
} from 'lucide-react';
import {
  formatCurrency, formatDateTime, formatWeight,
  getLoadStatusColor, getLoadStatusLabel, getDriverStatusColor,
} from '@/utils';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const STATUS_FLOW = [
  'OPEN', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP',
  'PICKED_UP', 'EN_ROUTE_DELIVERY', 'DELIVERED', 'COMPLETED',
];

export default function LoadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [toast, setToast] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['load', id],
    queryFn: () => loadsApi.getById(id),
    refetchInterval: 15000,
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers', 'available'],
    queryFn: () => driversApi.getAll({ status: 'AVAILABLE', limit: '100' }),
    enabled: showAssignModal,
  });

  const availableDrivers = driversData?.data?.data || [];
  const load = data?.data?.data;

  const assignMutation = useMutation({
    mutationFn: () => loadsApi.assign(id, selectedDriverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load', id] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      setShowAssignModal(false);
      setToast('Driver assigned successfully!');
      setTimeout(() => setToast(''), 3000);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => loadsApi.update(id, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load', id] });
      setShowCancelDialog(false);
    },
  });

  if (isLoading) return <AuthGuard><DashboardLayout><LoadingPage /></DashboardLayout></AuthGuard>;
  if (!load) return null;

  const statusIndex = STATUS_FLOW.indexOf(load.status);
  const canAssign = load.status === 'OPEN';
  const canCancel = !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(load.status);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">

          {toast && (
            <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium shadow-lg">
              {toast}
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Link href="/loads" className="btn-ghost">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {load.pickupAddress} → {load.deliveryAddress}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className={getLoadStatusColor(load.status)}>
                    {getLoadStatusLabel(load.status)}
                  </Badge>
                  <span className="text-sm text-slate-500">{load.sourcePlatform}</span>
                  {load.externalLoadId && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      {load.externalLoadId}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canAssign && (
                <button onClick={() => setShowAssignModal(true)} className="btn-primary">
                  <Truck className="w-4 h-4" /> Assign Driver
                </button>
              )}
              {canCancel && (
                <button onClick={() => setShowCancelDialog(true)} className="btn-danger">
                  Cancel Load
                </button>
              )}
            </div>
          </div>

          {/* Status progress bar */}
          {load.status !== 'CANCELLED' && (
            <div className="card p-5">
              <div className="flex items-center gap-0">
                {STATUS_FLOW.map((s, i) => {
                  const done = i <= statusIndex;
                  const current = i === statusIndex;
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          done ? 'bg-accent border-accent text-white' : 'bg-white border-slate-200 text-slate-400'
                        } ${current ? 'ring-4 ring-accent/20' : ''}`}>
                          {done ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <span className={`text-xs whitespace-nowrap ${done ? 'text-accent font-medium' : 'text-slate-400'}`}>
                          {getLoadStatusLabel(s).split(' ')[0]}
                        </span>
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${i < statusIndex ? 'bg-accent' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main details */}
            <div className="lg:col-span-2 space-y-4">

              {/* Route */}
              <div className="card p-5">
                <h3 className="section-title mb-4">Route</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <div className="w-0.5 h-12 bg-slate-200 my-1" />
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Pickup</p>
                        <p className="font-medium text-slate-900">{load.pickupAddress}</p>
                        <p className="text-xs text-slate-400">{load.pickupLat.toFixed(4)}, {load.pickupLng.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Delivery</p>
                        <p className="font-medium text-slate-900">{load.deliveryAddress}</p>
                        <p className="text-xs text-slate-400">{load.deliveryLat.toFixed(4)}, {load.deliveryLng.toFixed(4)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Load info */}
              <div className="card p-5">
                <h3 className="section-title mb-4">Load Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Type', value: load.loadType },
                    { label: 'Weight', value: formatWeight(load.weight) },
                    { label: 'Created', value: formatDateTime(load.createdAt) },
                    { label: 'Platform', value: load.sourcePlatform },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                      <p className="font-medium text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
                {load.notes && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Notes
                    </p>
                    <p className="text-sm text-amber-800">{load.notes}</p>
                  </div>
                )}
              </div>

              {/* Trip info if exists */}
              {load.assignment?.trip && (
                <div className="card p-5">
                  <h3 className="section-title mb-4">Trip Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Trip Started', value: load.assignment.trip.startedAt ? formatDateTime(load.assignment.trip.startedAt) : '—' },
                      { label: 'Pickup Time', value: load.assignment.trip.pickupTime ? formatDateTime(load.assignment.trip.pickupTime) : '—' },
                      { label: 'Delivery Time', value: load.assignment.trip.deliveryTime ? formatDateTime(load.assignment.trip.deliveryTime) : '—' },
                      { label: 'Recipient', value: load.assignment.trip.recipientName || '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                        <p className="font-medium text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>
                  {load.assignment.trip.podImage && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Proof of Delivery</p>
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/${load.assignment.trip.podImage}`}
                        alt="Proof of Delivery"
                        className="w-48 h-32 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar: financials + driver */}
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="section-title mb-4">Financials</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Broker Payout', value: formatCurrency(load.brokerPayout), color: 'text-slate-900' },
                    { label: 'Driver Payout', value: formatCurrency(load.driverPayout), color: 'text-slate-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className={`font-semibold ${color}`}>{value}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
                    <span className="font-semibold text-slate-900">Company Profit</span>
                    <span className="font-bold text-green-600">{formatCurrency(load.companyProfit)}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <span className="text-xs text-slate-500">Margin: </span>
                    <span className="text-xs font-bold text-green-600">
                      {((load.companyProfit / load.brokerPayout) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned driver */}
              {load.assignment?.driver && (
                <div className="card p-5">
                  <h3 className="section-title mb-4">Assigned Driver</h3>
                  <Link href={`/drivers/${load.assignment.driver.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                      {load.assignment.driver.user.firstName[0]}{load.assignment.driver.user.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {load.assignment.driver.user.firstName} {load.assignment.driver.user.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{load.assignment.driver.plateNumber}</p>
                    </div>
                  </Link>
                  <div className="mt-3">
                    <Badge className={getDriverStatusColor(load.assignment.driver.status)}>
                      {load.assignment.driver.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assign Driver Modal */}
        <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Driver" size="md">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Select an available driver for this load.</p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableDrivers.length === 0 && (
                <p className="text-center py-6 text-sm text-slate-400">No available drivers</p>
              )}
              {availableDrivers.map((driver: any) => (
                <label
                  key={driver.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedDriverId === driver.id ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="driver"
                    value={driver.id}
                    checked={selectedDriverId === driver.id}
                    onChange={() => setSelectedDriverId(driver.id)}
                    className="accent-accent"
                  />
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xs font-bold">
                    {driver.user.firstName[0]}{driver.user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {driver.user.firstName} {driver.user.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{driver.vehicleMake} {driver.vehicleModel} · ★ {driver.rating.toFixed(1)}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button className="btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={!selectedDriverId || assignMutation.isPending}
                onClick={() => assignMutation.mutate()}
              >
                {assignMutation.isPending ? <Spinner size="sm" /> : 'Assign Driver'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Cancel dialog */}
        <ConfirmDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={() => cancelMutation.mutate()}
          title="Cancel Load"
          message="Are you sure you want to cancel this load? This action cannot be undone."
          confirmLabel="Cancel Load"
          isDestructive
          isLoading={cancelMutation.isPending}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}
