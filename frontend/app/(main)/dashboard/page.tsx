'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { AdopterDashboard } from './adopter-dashboard';
import { RescuerDashboard } from './rescuer-dashboard';
import { AdminDashboard } from './admin-dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [isAuthenticated, router]);

  if (!user) return null;

  if (user.role === 'ADMIN') return <AdminDashboard />;
  if (user.role === 'RESCATISTA') return <RescuerDashboard />;
  return <AdopterDashboard />;
}
