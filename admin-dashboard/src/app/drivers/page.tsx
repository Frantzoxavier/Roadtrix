'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { Badge, LoadingPage, EmptyState, Modal, ConfirmDialog, Spinner, Pagination } from '@/components/ui';
import { Plus, Search, Truck, Star, Phone, Mail, Filter } from 'lucide-react';
import { formatDate, getDriverStatusColor, getInitials } from '@/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = ['', 'AVAILABLE', 'ON_TRIP', 'UNAVAILABLE', 'SUSPENDED'];

export default function DriversPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', search, status, page],
    queryFn: () => driversApi.getAll({
      search: search || '',
      status: status || '',
      page: String(page),
      limit: '20',
    }),
  });

  const drivers = data?.data?.data || [];
  const meta = data?.data?.meta;

  const createMutation = useMutation({
    mutationFn: driversApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setShowCreateModal(false);
      setToast('Driver created successfully!');
      setTimeout(() => setToast(''), 3000);
    },
  });

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    licenseNumber: '', licenseExpiration: '',
    vehicleType: 'Dry Van', vehicleMake: '', vehicleModel: '', plateNumber: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form as any);
  };

  return (
    <AuthGuard>
      <DashboardLayout title="Drivers">
        <div className="space-y-5">

          {/* Toast */}
          {toast && (
            <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium shadow-lg">
              {toast}
            </div>
          )}

          {/* Header actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search drivers..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input pl-9"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="input pl-9 pr-4 appearance-none cursor-pointer"
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Driver
              </button>
            </div>
          </div>

          {/* Drivers grid */}
          {isLoading ? (
            <LoadingPage />
          ) : drivers.length === 0 ? (
            <EmptyState
              icon={<Truck className="w-12 h-12" />}
              title="No drivers found"
              description="Add your first driver to get started."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add Driver
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {drivers.map((driver: any) => (
                  <div
                    key={driver.id}
                    className="card p-5 hover:border-accent/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/drivers/${driver.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                          {getInitials(driver.user.firstName, driver.user.lastName)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {driver.user.firstName} {driver.user.lastName}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs text-slate-500">{driver.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getDriverStatusColor(driver.status)}>
                        {driver.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{driver.vehicleMake} {driver.vehicleModel} · {driver.vehicleType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{driver.user.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{driver.user.email}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>License: {driver.licenseNumber}</span>
                      <span>Exp: {formatDate(driver.licenseExpiration)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {meta && (
                <Pagination
                  page={page}
                  totalPages={meta.totalPages || 1}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </div>

        {/* Create Driver Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Driver" size="lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input className="input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">License Number</label>
                <input className="input" required value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>
              <div>
                <label className="label">License Expiration</label>
                <input className="input" type="date" required value={form.licenseExpiration} onChange={e => setForm({ ...form, licenseExpiration: e.target.value })} />
              </div>
              <div>
                <label className="label">Vehicle Type</label>
                <select className="input" value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                  {['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Box Truck'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Vehicle Make</label>
                <input className="input" required value={form.vehicleMake} onChange={e => setForm({ ...form, vehicleMake: e.target.value })} placeholder="Freightliner" />
              </div>
              <div>
                <label className="label">Vehicle Model</label>
                <input className="input" required value={form.vehicleModel} onChange={e => setForm({ ...form, vehicleModel: e.target.value })} placeholder="Cascadia" />
              </div>
              <div>
                <label className="label">Plate Number</label>
                <input className="input" required value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} />
              </div>
            </div>
            <p className="text-xs text-slate-500">Default password: <code className="bg-slate-100 px-1 rounded">Driver@123</code></p>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Spinner size="sm" /> : 'Create Driver'}
              </button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
