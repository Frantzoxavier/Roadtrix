'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { LoadingPage, StatCard } from '@/components/ui';
import { TrendingUp, DollarSign, Package, Truck, Star } from 'lucide-react';
import { formatCurrency } from '@/utils';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.get,
    refetchInterval: 60000,
  });

  const analytics = data?.data?.data;

  if (isLoading) return <AuthGuard><DashboardLayout title="Analytics"><LoadingPage /></DashboardLayout></AuthGuard>;

  const revenueChartData = {
    labels: analytics?.revenueByDay?.map((d: any) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Revenue',
        data: analytics?.revenueByDay?.map((d: any) => d.revenue) || [],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Profit',
        data: analytics?.revenueByDay?.map((d: any) => d.profit) || [],
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22, 163, 74, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { callback: (v: any) => `$${(v / 1000).toFixed(0)}k`, font: { size: 11 } },
      },
    },
  };

  const loadStatusData = {
    labels: ['Open', 'Active', 'Completed', 'Cancelled'],
    datasets: [{
      label: 'Loads',
      data: [
        analytics?.loads?.total - analytics?.loads?.active - analytics?.loads?.completed - analytics?.loads?.cancelled,
        analytics?.loads?.active,
        analytics?.loads?.completed,
        analytics?.loads?.cancelled,
      ],
      backgroundColor: ['#94a3b8', '#2563EB', '#16A34A', '#dc2626'],
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1 } },
    },
  };

  return (
    <AuthGuard>
      <DashboardLayout title="Analytics">
        <div className="space-y-6">

          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(analytics?.revenue?.total || 0)}
              subtitle={`${formatCurrency(analytics?.revenue?.thisMonth || 0)} this month`}
              icon={<DollarSign className="w-5 h-5" />}
              trend={{ value: analytics?.revenue?.growth || 0, label: 'vs last month' }}
              accentColor="bg-accent/10 text-accent"
            />
            <StatCard
              title="Net Profit"
              value={formatCurrency(analytics?.profit?.total || 0)}
              subtitle={`${analytics?.profit?.margin || 0}% margin`}
              icon={<TrendingUp className="w-5 h-5" />}
              accentColor="bg-green-100 text-green-600"
            />
            <StatCard
              title="Load Completion"
              value={`${analytics?.loads?.completionRate || 0}%`}
              subtitle={`${analytics?.loads?.completed || 0} of ${analytics?.loads?.total || 0} loads`}
              icon={<Package className="w-5 h-5" />}
              accentColor="bg-orange-100 text-orange-600"
            />
            <StatCard
              title="Driver Fleet"
              value={analytics?.drivers?.total || 0}
              subtitle={`${analytics?.drivers?.available || 0} available`}
              icon={<Truck className="w-5 h-5" />}
              accentColor="bg-purple-100 text-purple-600"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 card p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="section-title">Revenue & Profit — Last 30 Days</h3>
              </div>
              <div className="h-64">
                <Line data={revenueChartData} options={chartOptions} />
              </div>
            </div>

            <div className="card p-5">
              <h3 className="section-title mb-5">Load Breakdown</h3>
              <div className="h-64">
                <Bar data={loadStatusData} options={barOptions} />
              </div>
            </div>
          </div>

          {/* Top Drivers */}
          <div className="card">
            <div className="p-5 border-b border-slate-100">
              <h3 className="section-title">Top Performing Drivers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Rank', 'Driver', 'Loads Completed', 'Total Earned', 'Rating'].map(h => (
                      <th key={h} className="table-header py-3 px-5 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.topDrivers || []).map((item: any, i: number) => (
                    <tr key={item.driver.id} className="table-row">
                      <td className="table-cell px-5">
                        <span className={`text-lg font-bold ${
                          i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-300'
                        }`}>#{i + 1}</span>
                      </td>
                      <td className="table-cell px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xs font-bold">
                            {item.driver.user.firstName[0]}{item.driver.user.lastName[0]}
                          </div>
                          <span className="font-medium text-slate-900">
                            {item.driver.user.firstName} {item.driver.user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell px-5 font-semibold">{item.loads}</td>
                      <td className="table-cell px-5 font-semibold text-green-600">{formatCurrency(item.earnings)}</td>
                      <td className="table-cell px-5">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-medium">{item.driver.rating.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!analytics?.topDrivers?.length && (
                    <tr><td colSpan={5} className="text-center py-8 text-sm text-slate-400">No data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="section-title mb-4">Revenue Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'This Month', value: analytics?.revenue?.thisMonth, bg: 'bg-accent/10 text-accent' },
                  { label: 'Last Month', value: analytics?.revenue?.lastMonth, bg: 'bg-slate-100 text-slate-600' },
                  { label: 'All Time', value: analytics?.revenue?.total, bg: 'bg-green-100 text-green-700' },
                ].map(({ label, value, bg }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${bg}`}>
                      {formatCurrency(value || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="section-title mb-4">Profit Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'This Month', value: analytics?.profit?.thisMonth, bg: 'bg-green-100 text-green-700' },
                  { label: 'Last Month', value: analytics?.profit?.lastMonth, bg: 'bg-slate-100 text-slate-600' },
                  { label: 'All Time', value: analytics?.profit?.total, bg: 'bg-emerald-100 text-emerald-700' },
                ].map(({ label, value, bg }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${bg}`}>
                      {formatCurrency(value || 0)}
                    </span>
                  </div>
                ))}
                <div className="p-3 rounded-xl bg-slate-50 flex justify-between">
                  <span className="text-sm text-slate-600">Avg Margin</span>
                  <span className="text-sm font-bold text-green-600">{analytics?.profit?.margin}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
