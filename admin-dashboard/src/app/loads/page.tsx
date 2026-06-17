'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadsApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { Badge, LoadingPage, EmptyState, Modal, Spinner, Pagination } from '@/components/ui';
import { Plus, Search, Package, Filter, MapPin, Weight } from 'lucide-react';
import { formatCurrency, formatDateTime, getLoadStatusColor, getLoadStatusLabel } from '@/utils';
import { useRouter } from 'next/navigation';

const LOAD_STATUSES = ['OPEN', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
const PLATFORMS = ['Uber Freight', 'DAT Load Board', 'Truckstop.com', 'Echo Global', 'Convoy'];
const LOAD_TYPES = ['General Freight', 'Refrigerated', 'Flatbed', 'Hazmat', 'Electronics', 'Auto Parts', 'Food & Beverage'];

const EMPTY_FORM = {
  sourcePlatform: 'Uber Freight', externalLoadId: '',
  pickupAddress: '', pickupLat: '', pickupLng: '',
  deliveryAddress: '', deliveryLat: '', deliveryLng: '',
  loadType: 'General Freight', weight: '', brokerPayout: '', driverPayout: '', notes: '',
};

export default function LoadsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [toast, setToast] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['loads', search, status, page],
    queryFn: () => loadsApi.getAll({ search, status, page: String(page), limit: '20' }),
  });

  const loads = data?.data?.data || [];
  const meta = data?.data?.meta;

  const createMutation = useMutation({
    mutationFn: (payload: any) => loadsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      setShowCreateModal(false);
      setForm({ ...EMPTY_FORM });
      setToast('Load created successfully!');
      setTimeout(() => setToast(''), 3000);
    },
  });

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      pickupLat: parseFloat(form.pickupLat),
      pickupLng: parseFloat(form.pickupLng),
      deliveryLat: parseFloat(form.deliveryLat),
      deliveryLng: parseFloat(form.deliveryLng),
      weight: parseFloat(form.weight),
      brokerPayout: parseFloat(form.brokerPayout),
      driverPayout: parseFloat(form.driverPayout),
    });
  };

  return (
    <AuthGuard>
      <DashboardLayout title="Loads">
        <div className="space-y-5">

          {toast && (
            <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium shadow-lg">
              {toast}
            </div>
          )}

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by address or load ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="input pl-9"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={status}
                  onChange={e => { setStatus(e.target.value); setPage(1); }}
                  className="input pl-9 appearance-none cursor-pointer"
                >
                  <option value="">All Status</option>
                  {LOAD_STATUSES.map(s => <option key={s} value={s}>{getLoadStatusLabel(s)}</option>)}
                </select>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary whitespace-nowrap">
                <Plus className="w-4 h-4" /> Create Load
              </button>
            </div>
          </div>

          {/* Loads table */}
          {isLoading ? <LoadingPage /> : loads.length === 0 ? (
            <EmptyState
              icon={<Package className="w-12 h-12" />}
              title="No loads found"
              description="Create your first load to get started."
              action={<button onClick={() => setShowCreateModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create Load</button>}
            />
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Route', 'Type', 'Platform', 'Payout', 'Profit', 'Driver', 'Status', 'Date'].map(h => (
                        <th key={h} className="table-header py-3 px-4 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loads.map((load: any) => (
                      <tr
                        key={load.id}
                        className="table-row cursor-pointer"
                        onClick={() => router.push(`/loads/${load.id}`)}
                      >
                        <td className="table-cell">
                          <div className="max-w-xs">
                            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{load.pickupAddress}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{load.deliveryAddress}</span>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="font-medium text-slate-900 text-xs">{load.loadType}</p>
                            <p className="text-slate-400 text-xs">{load.weight.toLocaleString()} lbs</p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="text-xs text-slate-600">{load.sourcePlatform}</span>
                        </td>
                        <td className="table-cell font-semibold text-slate-900">
                          {formatCurrency(load.brokerPayout)}
                        </td>
                        <td className="table-cell font-semibold text-green-600">
                          {formatCurrency(load.companyProfit)}
                        </td>
                        <td className="table-cell">
                          {load.assignment?.driver ? (
                            <span className="text-sm text-slate-700">
                              {load.assignment.driver.user.firstName} {load.assignment.driver.user.lastName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Unassigned</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <Badge className={getLoadStatusColor(load.status)}>
                            {getLoadStatusLabel(load.status)}
                          </Badge>
                        </td>
                        <td className="table-cell text-xs text-slate-500">
                          {formatDateTime(load.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && <Pagination page={page} totalPages={meta.totalPages || 1} onPage={setPage} />}
            </div>
          )}
        </div>

        {/* Create Load Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Load" size="xl">
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Source Platform</label>
                <select className="input" value={form.sourcePlatform} onChange={f('sourcePlatform')}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">External Load ID (optional)</label>
                <input className="input" value={form.externalLoadId} onChange={f('externalLoadId')} placeholder="EXT-12345" />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Pickup</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 md:col-span-1">
                  <label className="label">Address</label>
                  <input className="input" required value={form.pickupAddress} onChange={f('pickupAddress')} placeholder="Chicago, IL" />
                </div>
                <div>
                  <label className="label">Latitude</label>
                  <input className="input" type="number" step="any" required value={form.pickupLat} onChange={f('pickupLat')} placeholder="41.8781" />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <input className="input" type="number" step="any" required value={form.pickupLng} onChange={f('pickupLng')} placeholder="-87.6298" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Delivery</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 md:col-span-1">
                  <label className="label">Address</label>
                  <input className="input" required value={form.deliveryAddress} onChange={f('deliveryAddress')} placeholder="Los Angeles, CA" />
                </div>
                <div>
                  <label className="label">Latitude</label>
                  <input className="input" type="number" step="any" required value={form.deliveryLat} onChange={f('deliveryLat')} placeholder="34.0522" />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <input className="input" type="number" step="any" required value={form.deliveryLng} onChange={f('deliveryLng')} placeholder="-118.2437" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Load Details</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Load Type</label>
                  <select className="input" value={form.loadType} onChange={f('loadType')}>
                    {LOAD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Weight (lbs)</label>
                  <input className="input" type="number" required value={form.weight} onChange={f('weight')} placeholder="25000" />
                </div>
                <div>
                  <label className="label">Broker Payout ($)</label>
                  <input className="input" type="number" step="0.01" required value={form.brokerPayout} onChange={f('brokerPayout')} placeholder="2500.00" />
                </div>
                <div>
                  <label className="label">Driver Payout ($)</label>
                  <input className="input" type="number" step="0.01" required value={form.driverPayout} onChange={f('driverPayout')} placeholder="1750.00" />
                </div>
              </div>
            </div>

            {form.brokerPayout && form.driverPayout && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700 font-medium">
                  Company Profit: {formatCurrency(parseFloat(form.brokerPayout) - parseFloat(form.driverPayout))}
                  <span className="text-green-500 ml-2">
                    ({((1 - parseFloat(form.driverPayout) / parseFloat(form.brokerPayout)) * 100).toFixed(1)}% margin)
                  </span>
                </p>
              </div>
            )}

            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={form.notes}
                onChange={f('notes')}
                placeholder="Special handling instructions..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Spinner size="sm" /> : 'Create Load'}
              </button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
