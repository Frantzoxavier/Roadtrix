'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi, loadsApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { Badge, LoadingPage, ConfirmDialog, Modal, Spinner } from '@/components/ui';
import {
  ArrowLeft, Star, Truck, Phone, Mail, CreditCard,
  MapPin, Calendar, Shield, Package, AlertTriangle,
} from 'lucide-react';
import {
  formatDate, formatDateTime, formatCurrency, getDriverStatusColor,
  getLoadStatusColor, getLoadStatusLabel,
} from '@/utils';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

const DRIVER_STATUSES = ['AVAILABLE', 'UNAVAILABLE', 'SUSPENDED'];

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => driversApi.getById(id),
  });

  const driver = data?.data?.data;

  const updateMutation = useMutation({
    mutationFn: (data: any) => driversApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', id] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setShowStatusModal(false);
      setShowSuspendDialog(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => driversApi.delete(id),
    onSuccess: () => router.push('/drivers'),
  });

  if (isLoading) return <AuthGuard><DashboardLayout><LoadingPage /></DashboardLayout></AuthGuard>;
  if (!driver) return null;

  const isSuspended = driver.status === 'SUSPENDED';

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Back + header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Link href="/drivers" className="btn-ghost">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent font-bold text-xl">
                  {driver.user.firstName[0]}{driver.user.lastName[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {driver.user.firstName} {driver.user.lastName}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className={getDriverStatusColor(driver.status)}>
                      {driver.status.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium">{driver.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStatusModal(true)}
                className="btn-secondary"
              >
                Update Status
              </button>
              {!isSuspended ? (
                <button
                  onClick={() => setShowSuspendDialog(true)}
                  className="btn-danger"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Suspend
                </button>
              ) : (
                <button
                  onClick={() => updateMutation.mutate({ status: 'AVAILABLE' })}
                  className="btn-primary"
                >
                  Reinstate
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Info cards */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider text-slate-400">Contact</h3>
                <div className="space-y-3">
                  {[
                    { icon: Mail, value: driver.user.email },
                    { icon: Phone, value: driver.user.phone },
                  ].map(({ icon: Icon, value }) => (
                    <div key={value} className="flex items-center gap-3 text-sm text-slate-600">
                      <Icon className="w-4 h-4 text-slate-400" />
                      {value}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5 space-y-4">
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold">Vehicle</h3>
                <div className="space-y-3">
                  {[
                    { icon: Truck, label: 'Type', value: driver.vehicleType },
                    { icon: Truck, label: 'Make/Model', value: `${driver.vehicleMake} ${driver.vehicleModel}` },
                    { icon: CreditCard, label: 'Plate', value: driver.plateNumber },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5 space-y-4">
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold">License</h3>
                <div className="space-y-3">
                  {[
                    { icon: Shield, label: 'Number', value: driver.licenseNumber },
                    { icon: Calendar, label: 'Expires', value: formatDate(driver.licenseExpiration) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent assignments */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="section-title">Recent Loads</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {driver.assignments?.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-400">No loads assigned yet</div>
                  )}
                  {driver.assignments?.map((assignment: any) => (
                    <Link
                      key={assignment.id}
                      href={`/loads/${assignment.loadId}`}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {assignment.load.pickupAddress} → {assignment.load.deliveryAddress}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Assigned {formatDateTime(assignment.assignedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(assignment.load.driverPayout)}
                        </span>
                        <Badge className={getLoadStatusColor(assignment.load.status)}>
                          {getLoadStatusLabel(assignment.load.status)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Payments */}
              <div className="card">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="section-title">Recent Payments</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {driver.payments?.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-400">No payments yet</div>
                  )}
                  {driver.payments?.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(payment.createdAt)}</p>
                      </div>
                      <Badge className={
                        payment.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        payment.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suspend dialog */}
        <ConfirmDialog
          isOpen={showSuspendDialog}
          onClose={() => setShowSuspendDialog(false)}
          onConfirm={() => updateMutation.mutate({ status: 'SUSPENDED' })}
          title="Suspend Driver"
          message={`Are you sure you want to suspend ${driver.user.firstName} ${driver.user.lastName}? They will not be able to accept loads.`}
          confirmLabel="Suspend Driver"
          isDestructive
          isLoading={updateMutation.isPending}
        />

        {/* Status modal */}
        <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Driver Status" size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">New Status</label>
              <select
                className="input"
                value={newStatus || driver.status}
                onChange={e => setNewStatus(e.target.value)}
              >
                {DRIVER_STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={() => updateMutation.mutate({ status: newStatus || driver.status })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <Spinner size="sm" /> : 'Update'}
              </button>
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
