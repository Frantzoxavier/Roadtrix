'use client';

import { useAuth, roleHome } from '@/lib/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui';

/** Roles allowed for a given path prefix. /driver/* is driver-only; everything else is staff-only. */
function allowedRoles(pathname: string): string[] {
  return pathname.startsWith('/driver') ? ['DRIVER'] : ['ADMIN', 'DISPATCHER'];
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const roleAllowed = !user || allowedRoles(pathname).includes(user.role);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user && !roleAllowed) {
      // Authenticated but on an area for a different role — send them home.
      router.replace(roleHome(user.role));
    }
  }, [isAuthenticated, isLoading, user, roleAllowed, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Loading RoadTrix...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !roleAllowed) return null;

  return <>{children}</>;
}
