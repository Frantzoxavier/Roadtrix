'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { Settings, User, Bell, Shield, Building } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <DashboardLayout title="Settings">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Profile */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <User className="w-5 h-5 text-accent" />
              <h3 className="section-title">Profile</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input className="input" defaultValue={user?.firstName} disabled />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" defaultValue={user?.lastName} disabled />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" defaultValue={user?.email} disabled />
              </div>
              <div>
                <label className="label">Role</label>
                <input className="input" defaultValue={user?.role} disabled />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Contact your administrator to update profile information.</p>
          </div>

          {/* Company */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <Building className="w-5 h-5 text-accent" />
              <h3 className="section-title">Company</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Company Name</label>
                <input className="input" defaultValue="RoadTrix Logistics" />
              </div>
              <div>
                <label className="label">DOT Number</label>
                <input className="input" placeholder="US DOT #" />
              </div>
              <div>
                <label className="label">MC Number</label>
                <input className="input" placeholder="MC #" />
              </div>
              <div>
                <label className="label">Time Zone</label>
                <select className="input">
                  <option>America/New_York (EST)</option>
                  <option>America/Chicago (CST)</option>
                  <option>America/Denver (MST)</option>
                  <option>America/Los_Angeles (PST)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn-primary">Save Changes</button>
            </div>
          </div>

          {/* Notifications */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <Bell className="w-5 h-5 text-accent" />
              <h3 className="section-title">Notifications</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'New load assigned', desc: 'Get notified when a load is assigned to a driver' },
                { label: 'Load delivered', desc: 'Get notified when a load is marked as delivered' },
                { label: 'Driver offline', desc: 'Get notified when a driver goes offline during a trip' },
                { label: 'Payment due', desc: 'Get notified about pending driver payments' },
              ].map(({ label, desc }) => (
                <label key={label} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-5 bg-slate-200 peer-checked:bg-accent rounded-full transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <Shield className="w-5 h-5 text-accent" />
              <h3 className="section-title">Security</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              <div className="flex justify-end">
                <button className="btn-primary">Update Password</button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
