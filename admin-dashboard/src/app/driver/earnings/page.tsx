'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { Badge, LoadingPage, EmptyState, StatCard } from '@/components/ui';
import { Wallet, CalendarDays, TrendingUp, Clock } from 'lucide-react';
import { formatCurrency, formatDate, getPaymentStatusColor } from '@/utils';

export default function EarningsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-payments'],
    queryFn: () => paymentsApi.getAll({ limit: '50' }),
  });

  // Driver endpoint returns { payments, total, page, limit, summary }; staff returns an array.
  const raw = data?.data?.data;
  const payments: any[] = Array.isArray(raw) ? raw : raw?.payments || [];
  const summary = (Array.isArray(raw) ? null : raw?.summary) || {};

  const paidTotal = summary.total ?? payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const pendingTotal = summary.pending ?? payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);

  return (
    <AuthGuard>
      <DashboardLayout title="Earnings">
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="This week" value={formatCurrency(summary.weekly ?? 0)} icon={<CalendarDays className="w-5 h-5" />} />
            <StatCard title="This month" value={formatCurrency(summary.monthly ?? 0)} icon={<TrendingUp className="w-5 h-5" />} />
            <StatCard title="Total paid" value={formatCurrency(paidTotal)} icon={<Wallet className="w-5 h-5" />} />
            <StatCard title="Pending" value={formatCurrency(pendingTotal)} icon={<Clock className="w-5 h-5" />} accentColor="bg-amber-100 text-amber-600" />
          </div>

          {/* Payment history */}
          {isLoading ? (
            <LoadingPage />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-12 h-12" />}
              title="No payouts yet"
              description="Earnings appear here once your delivered loads are processed."
            />
          ) : (
            <div className="card">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="section-title">Payout history</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Load', 'Route', 'Amount', 'Status', 'Date'].map((h) => (
                        <th key={h} className="table-header py-3 px-5 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="table-row">
                        <td className="table-cell font-medium">#{p.load?.externalLoadId ?? '—'}</td>
                        <td className="table-cell text-slate-500">
                          {p.load ? `${p.load.pickupAddress} → ${p.load.deliveryAddress}` : '—'}
                        </td>
                        <td className="table-cell font-semibold text-accent">{formatCurrency(p.amount)}</td>
                        <td className="table-cell"><Badge className={getPaymentStatusColor(p.status)}>{p.status}</Badge></td>
                        <td className="table-cell text-slate-500">{formatDate(p.payoutDate || p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
