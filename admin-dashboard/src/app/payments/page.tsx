'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { Badge, LoadingPage, EmptyState, ConfirmDialog, Pagination } from '@/components/ui';
import { CreditCard, CheckCircle, Clock, Filter, DollarSign } from 'lucide-react';
import { formatCurrency, formatDateTime, getPaymentStatusColor } from '@/utils';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', status, page],
    queryFn: () => paymentsApi.getAll({ status, page: String(page), limit: '20' }),
  });

  const payments = data?.data?.data || [];
  const meta = data?.data?.meta;

  const processMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.process(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setConfirmId(null);
    },
  });

  // Summary stats
  const pendingTotal = payments
    .filter((p: any) => p.status === 'PENDING')
    .reduce((s: number, p: any) => s + p.amount, 0);

  const paidTotal = payments
    .filter((p: any) => p.status === 'PAID')
    .reduce((s: number, p: any) => s + p.amount, 0);

  return (
    <AuthGuard>
      <DashboardLayout title="Payments">
        <div className="space-y-5">

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Pending Payouts', value: formatCurrency(pendingTotal), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
              { label: 'Paid Out', value: formatCurrency(paidTotal), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
              { label: 'Total Payments', value: meta?.total || payments.length, icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="card p-5 flex items-center gap-4">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={status}
                onChange={e => { setStatus(e.target.value); setPage(1); }}
                className="input pl-9 appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                {['PENDING', 'PROCESSING', 'PAID', 'FAILED'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payments table */}
          {isLoading ? <LoadingPage /> : payments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-12 h-12" />}
              title="No payments found"
              description="Payments are created automatically when loads are delivered."
            />
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Driver', 'Amount', 'Status', 'Created', 'Paid Date', 'Actions'].map(h => (
                        <th key={h} className="table-header py-3 px-4 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment: any) => (
                      <tr key={payment.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xs font-bold">
                              {payment.driver.user.firstName[0]}{payment.driver.user.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">
                                {payment.driver.user.firstName} {payment.driver.user.lastName}
                              </p>
                              <p className="text-xs text-slate-400">{payment.driver.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell font-bold text-slate-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="table-cell">
                          <Badge className={getPaymentStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="table-cell text-sm text-slate-500">
                          {formatDateTime(payment.createdAt)}
                        </td>
                        <td className="table-cell text-sm text-slate-500">
                          {payment.payoutDate ? formatDateTime(payment.payoutDate) : '—'}
                        </td>
                        <td className="table-cell">
                          {payment.status === 'PENDING' && (
                            <button
                              onClick={() => setConfirmId(payment.id)}
                              className="btn-primary text-xs px-3 py-1.5"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Mark Paid
                            </button>
                          )}
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

        <ConfirmDialog
          isOpen={!!confirmId}
          onClose={() => setConfirmId(null)}
          onConfirm={() => confirmId && processMutation.mutate(confirmId)}
          title="Mark Payment as Paid"
          message="Confirm this payment has been sent to the driver?"
          confirmLabel="Mark as Paid"
          isLoading={processMutation.isPending}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}
