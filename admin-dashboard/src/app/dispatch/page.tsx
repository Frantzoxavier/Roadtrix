'use client';

import { useQuery } from '@tanstack/react-query';
import { driversApi, loadsApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { Badge, LoadingPage } from '@/components/ui';
import { MapPin, Truck, Package, Navigation } from 'lucide-react';
import { formatCurrency, getLoadStatusColor, getLoadStatusLabel, getDriverStatusColor } from '@/utils';
import Link from 'next/link';

export default function DispatchPage() {
  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers', 'all'],
    queryFn: () => driversApi.getAll({ limit: '100' }),
    refetchInterval: 15000,
  });

  const { data: loadsData, isLoading: loadsLoading } = useQuery({
    queryKey: ['loads', 'active'],
    queryFn: () => loadsApi.getAll({
      limit: '50',
      status: 'EN_ROUTE_PICKUP,PICKED_UP,EN_ROUTE_DELIVERY,ASSIGNED,ACCEPTED',
    }),
    refetchInterval: 15000,
  });

  const { data: openLoadsData } = useQuery({
    queryKey: ['loads', 'open'],
    queryFn: () => loadsApi.getAll({ status: 'OPEN', limit: '20' }),
    refetchInterval: 15000,
  });

  const drivers = driversData?.data?.data || [];
  const activeLoads = loadsData?.data?.data || [];
  const openLoads = openLoadsData?.data?.data || [];

  const driversOnTrip = drivers.filter((d: any) => d.status === 'ON_TRIP');
  const availableDrivers = drivers.filter((d: any) => d.status === 'AVAILABLE');

  const isLoading = driversLoading || loadsLoading;

  return (
    <AuthGuard>
      <DashboardLayout title="Dispatch Board">
        {isLoading ? <LoadingPage /> : (
          <div className="space-y-6">

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'On Trip', value: driversOnTrip.length, color: 'text-blue-600', bg: 'bg-blue-100' },
                { label: 'Available', value: availableDrivers.length, color: 'text-green-600', bg: 'bg-green-100' },
                { label: 'Active Loads', value: activeLoads.length, color: 'text-accent', bg: 'bg-accent/10' },
                { label: 'Open Loads', value: openLoads.length, color: 'text-amber-600', bg: 'bg-amber-100' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="card p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${color}`}>{value}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-600">{label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Drivers on Trip */}
              <div className="card">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <h3 className="section-title">Drivers On Trip</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {driversOnTrip.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-400">No drivers currently on trip</div>
                  )}
                  {driversOnTrip.map((driver: any) => (
                    <div key={driver.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                            {driver.user.firstName[0]}{driver.user.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {driver.user.firstName} {driver.user.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{driver.vehicleMake} {driver.vehicleModel}</p>
                          </div>
                        </div>
                        <Badge className={getDriverStatusColor(driver.status)}>
                          {driver.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {driver.currentLat && driver.currentLng && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Navigation className="w-3 h-3 text-accent" />
                          <span>{driver.currentLat.toFixed(4)}, {driver.currentLng.toFixed(4)}</span>
                          {driver.lastLocationAt && (
                            <span className="text-slate-400">· Updated just now</span>
                          )}
                        </div>
                      )}
                      <Link href={`/drivers/${driver.id}`} className="text-xs text-accent hover:underline mt-1 inline-block">
                        View Profile →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Loads */}
              <div className="card">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  <h3 className="section-title">Active Loads</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {activeLoads.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-400">No active loads</div>
                  )}
                  {activeLoads.map((load: any) => (
                    <Link key={load.id} href={`/loads/${load.id}`} className="block p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{load.pickupAddress}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-red-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{load.deliveryAddress}</span>
                          </div>
                        </div>
                        <Badge className={getLoadStatusColor(load.status)}>
                          {getLoadStatusLabel(load.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {load.assignment?.driver
                            ? `${load.assignment.driver.user.firstName} ${load.assignment.driver.user.lastName}`
                            : 'Unassigned'}
                        </span>
                        <span className="font-semibold text-slate-700">{formatCurrency(load.brokerPayout)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Available Drivers */}
              <div className="card">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="section-title">Available Drivers</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {availableDrivers.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-400">No available drivers</div>
                  )}
                  {availableDrivers.map((driver: any) => (
                    <Link key={driver.id} href={`/drivers/${driver.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                          {driver.user.firstName[0]}{driver.user.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {driver.user.firstName} {driver.user.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{driver.vehicleType} · {driver.plateNumber}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Available</Badge>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Open Loads */}
              <div className="card">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="section-title">Open Loads</h3>
                  <Link href="/loads?status=OPEN" className="text-xs text-accent hover:underline">View all</Link>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {openLoads.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-400">No open loads</div>
                  )}
                  {openLoads.map((load: any) => (
                    <Link key={load.id} href={`/loads/${load.id}`} className="block p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {load.pickupAddress} → {load.deliveryAddress}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{load.loadType} · {load.weight.toLocaleString()} lbs</p>
                        </div>
                        <div className="ml-3 text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(load.brokerPayout)}</p>
                          <p className="text-xs text-green-600">{formatCurrency(load.companyProfit)} profit</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
