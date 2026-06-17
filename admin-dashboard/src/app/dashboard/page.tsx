'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, loadsApi, driversApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { StatCard, LoadingPage, Badge } from '@/components/ui';
import {
  TrendingUp, Truck, Package, DollarSign,
  Users, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { formatCurrency, getLoadStatusColor, getLoadStatusLabel, getDriverStatusColor, formatDateTime } from '@/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: analyticsRes, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsApi.get(),
    refetchInterval: 30000,
  });

  const { data: loadsRes } = useQuery({
    queryKey: ['loads', 'recent'],
    queryFn: () => loadsApi.getAll({ limit: '5', page: '1' }),
  });

  const { data: driversRes } = useQuery({
    queryKey: ['drivers', 'active'],
    queryFn: () => driversApi.getAll({ status: 'ON_TRIP', limit: '5' }),
  });

  const analytics = analyticsRes?.data?.data;
  const recentLoads = loadsRes?.data?.data || [];
  const activeDrivers = driversRes?.data?.data || [];

  if (analyticsLoading) {
    return (
      <AuthGuard>
        <DashboardLayout title="Dashboard">
          <LoadingPage />
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
              title="Active Loads"
              value={analytics?.loads?.active || 0}
              subtitle={`${analytics?.loads?.completed || 0} completed`}
              icon={<Package className="w-5 h-5" />}
              accentColor="bg-orange-100 text-orange-600"
            />
            <StatCard
              title="Drivers"
              value={analytics?.drivers?.total || 0}
              subtitle={`${analytics?.drivers?.available || 0} available · ${analytics?.drivers?.onTrip || 0} on trip`}
              icon={<Truck className="w-5 h-5" />}
              accentColor="bg-purple-100 text-purple-600"
            />
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Completion Rate', value: `${analytics?.loads?.completionRate || 0}%`, icon: CheckCircle, color: 'text-green-600' },
              { label: 'Open Loads', value: analytics?.loads?.total - analytics?.loads?.active - analytics?.loads?.completed - analytics?.loads?.cancelled || 0, icon: Clock, color: 'text-amber-600' },
              { label: 'Cancelled', value: analytics?.loads?.cancelled || 0, icon: XCircle, color: 'text-red-500' },
              { label: 'Total Drivers', value: analytics?.drivers?.total || 0, icon: Users, color: 'text-accent' },
            ].map((item) => (
              <div key={item.label} className="card p-4 flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <div>
                  <p className="text-lg font-bold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom grid: Recent Loads + Active Drivers */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Recent Loads */}
            <div className="card">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="section-title">Recent Loads</h2>
                <Link href="/loads" className="text-xs text-accent font-medium hover:underline">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentLoads.slice(0, 5).map((load: any) => (
                  <Link
                    key={load.id}
                    href={`/loads/${load.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {load.pickupAddress} → {load.deliveryAddress}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {load.sourcePlatform} · {formatDateTime(load.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(load.brokerPayout)}
                      </span>
                      <Badge className={getLoadStatusColor(load.status)}>
                        {getLoadStatusLabel(load.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
                {recentLoads.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-400">No loads yet</div>
                )}
              </div>
            </div>

            {/* Active Drivers */}
            <div className="card">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="section-title">Drivers On Trip</h2>
                <Link href="/drivers" className="text-xs text-accent font-medium hover:underline">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {activeDrivers.slice(0, 5).map((driver: any) => (
                  <Link
                    key={driver.id}
                    href={`/drivers/${driver.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                      {driver.user.firstName[0]}{driver.user.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {driver.user.firstName} {driver.user.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {driver.vehicleMake} {driver.vehicleModel} · {driver.plateNumber}
                      </p>
                    </div>
                    <Badge className={getDriverStatusColor(driver.status)}>
                      {driver.status.replace('_', ' ')}
                    </Badge>
                  </Link>
                ))}
                {activeDrivers.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-400">No drivers on trip</div>
                )}
              </div>
            </div>
          </div>

          {/* Top Drivers */}
          {analytics?.topDrivers?.length > 0 && (
            <div className="card">
              <div className="p-5 border-b border-slate-100">
                <h2 className="section-title">Top Performing Drivers</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="table-header py-3 px-4">Rank</th>
                      <th className="table-header py-3 px-4">Driver</th>
                      <th className="table-header py-3 px-4">Loads</th>
                      <th className="table-header py-3 px-4">Total Earnings</th>
                      <th className="table-header py-3 px-4">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topDrivers.map((item: any, i: number) => (
                      <tr key={item.driver.id} className="table-row">
                        <td className="table-cell">
                          <span className={`font-bold text-base ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-400'}`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xs font-bold">
                              {item.driver.user.firstName[0]}{item.driver.user.lastName[0]}
                            </div>
                            <span className="font-medium text-slate-900">
                              {item.driver.user.firstName} {item.driver.user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell font-semibold">{item.loads}</td>
                        <td className="table-cell font-semibold text-green-600">{formatCurrency(item.earnings)}</td>
                        <td className="table-cell">
                          <span className="text-amber-500 font-medium">★ {item.driver.rating.toFixed(1)}</span>
                        </td>
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
