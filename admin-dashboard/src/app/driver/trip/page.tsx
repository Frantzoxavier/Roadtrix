'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadsApi, driversApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { Badge, LoadingPage, EmptyState, Modal, Spinner, Toast } from '@/components/ui';
import { Navigation, MapPin, Package, Weight, DollarSign, CheckCircle2, Truck } from 'lucide-react';
import { formatCurrency, formatWeight, getLoadStatusColor, getLoadStatusLabel } from '@/utils';

// Ordered lifecycle for the progress stepper.
const FLOW = ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DELIVERY', 'DELIVERED'];

export default function ActiveTripPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState('');
  const [showDeliver, setShowDeliver] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [podFile, setPodFile] = useState<File | null>(null);

  const { data: activeRes, isLoading } = useQuery({
    queryKey: ['driver-active-load'],
    queryFn: () => driversApi.getActiveLoad(),
  });
  const assignment = activeRes?.data?.data || null;
  const load = assignment?.load || null;

  const refresh = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ['driver-active-load'] });
    queryClient.invalidateQueries({ queryKey: ['driver-loads'] });
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const acceptM = useMutation({ mutationFn: (id: string) => loadsApi.accept(id), onSuccess: () => refresh('Load accepted!') });
  const declineM = useMutation({ mutationFn: (id: string) => loadsApi.decline(id), onSuccess: () => refresh('Load declined.') });
  const startM = useMutation({ mutationFn: (id: string) => loadsApi.start(id), onSuccess: () => refresh('Trip started — drive safe!') });
  const pickupM = useMutation({ mutationFn: (id: string) => loadsApi.pickup(id), onSuccess: () => refresh('Cargo picked up!') });
  const deliverM = useMutation({
    mutationFn: ({ id, form }: { id: string; form: FormData }) => loadsApi.deliver(id, form),
    onSuccess: () => {
      setShowDeliver(false);
      setRecipientName('');
      setPodFile(null);
      refresh('Delivery confirmed — nice work!');
    },
  });
  const busy = acceptM.isPending || declineM.isPending || startM.isPending || pickupM.isPending;

  const submitDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!load || !recipientName.trim()) return;
    const form = new FormData();
    form.append('recipientName', recipientName.trim());
    if (podFile) form.append('podImage', podFile);
    deliverM.mutate({ id: load.id, form });
  };

  return (
    <AuthGuard>
      <DashboardLayout title="Active Trip">
        <div className="space-y-5 max-w-3xl">
          {toast && (
            <div className="fixed top-4 right-4 z-50">
              <Toast message={toast} type="success" onClose={() => setToast('')} />
            </div>
          )}

          {isLoading ? (
            <LoadingPage />
          ) : !load ? (
            <EmptyState
              icon={<Navigation className="w-12 h-12" />}
              title="No active trip"
              description="Accept an assigned load from My Loads to start a trip."
            />
          ) : (
            <>
              {/* Header */}
              <div className="card p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Current load #{load.externalLoadId}</p>
                    <h2 className="text-xl font-bold text-slate-900">{load.loadType}</h2>
                  </div>
                  <Badge className={getLoadStatusColor(load.status)}>{getLoadStatusLabel(load.status)}</Badge>
                </div>

                {/* Route */}
                <div className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <div className="flex-1 w-0.5 bg-slate-200 my-1" />
                    <MapPin className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Pickup</p>
                      <p className="font-medium text-slate-900">{load.pickupAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Delivery</p>
                      <p className="font-medium text-slate-900">{load.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Weight className="w-4 h-4 text-slate-400" />{formatWeight(load.weight)}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Package className="w-4 h-4 text-slate-400" />{load.sourcePlatform}</div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-accent"><DollarSign className="w-4 h-4" />{formatCurrency(load.driverPayout)}</div>
                </div>
              </div>

              {/* Progress stepper */}
              <div className="card p-6">
                <p className="section-title mb-4">Trip progress</p>
                <div className="space-y-3">
                  {FLOW.map((step, i) => {
                    const currentIdx = FLOW.indexOf(load.status);
                    const reached = currentIdx >= i && currentIdx !== -1;
                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${reached ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {reached ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                        </div>
                        <span className={`text-sm ${reached ? 'font-medium text-slate-900' : 'text-slate-400'}`}>{getLoadStatusLabel(step)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action bar */}
              <div className="card p-5">
                {load.status === 'ASSIGNED' && (
                  <div className="flex gap-3">
                    <button onClick={() => declineM.mutate(load.id)} disabled={busy} className="btn-secondary flex-1 justify-center">Decline</button>
                    <button onClick={() => acceptM.mutate(load.id)} disabled={busy} className="btn-primary flex-1 justify-center">
                      {acceptM.isPending ? <Spinner size="sm" /> : 'Accept load'}
                    </button>
                  </div>
                )}
                {load.status === 'ACCEPTED' && (
                  <button onClick={() => startM.mutate(load.id)} disabled={busy} className="btn-primary w-full justify-center">
                    {startM.isPending ? <Spinner size="sm" /> : <><Truck className="w-4 h-4" /> Start trip to pickup</>}
                  </button>
                )}
                {load.status === 'EN_ROUTE_PICKUP' && (
                  <button onClick={() => pickupM.mutate(load.id)} disabled={busy} className="btn-primary w-full justify-center">
                    {pickupM.isPending ? <Spinner size="sm" /> : <><Package className="w-4 h-4" /> Confirm cargo picked up</>}
                  </button>
                )}
                {(load.status === 'PICKED_UP' || load.status === 'EN_ROUTE_DELIVERY') && (
                  <button onClick={() => setShowDeliver(true)} className="btn-primary w-full justify-center">
                    <CheckCircle2 className="w-4 h-4" /> Complete delivery
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Delivery modal */}
        <Modal isOpen={showDeliver} onClose={() => setShowDeliver(false)} title="Proof of delivery" size="md">
          <form onSubmit={submitDelivery} className="space-y-4">
            <div>
              <label className="label">Recipient name</label>
              <input
                className="input"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Who signed for the delivery?"
                required
              />
            </div>
            <div>
              <label className="label">Proof photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPodFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white file:text-sm file:font-medium hover:file:bg-accent-700"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowDeliver(false)} className="btn-secondary" disabled={deliverM.isPending}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={deliverM.isPending || !recipientName.trim()}>
                {deliverM.isPending ? <Spinner size="sm" /> : 'Confirm delivery'}
              </button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
