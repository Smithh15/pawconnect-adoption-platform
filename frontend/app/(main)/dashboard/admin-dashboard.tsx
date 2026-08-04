'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, Clock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import type { PendingRescuerProfile } from '@/lib/types';

export function AdminDashboard() {
  const [pending, setPending] = useState<PendingRescuerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PendingRescuerProfile[]>('/admin/rescuers/pending')
      .then((res) => setPending(res.data))
      .catch(() => toast.error('Error al cargar los rescatistas pendientes'))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    try {
      await api.patch(`/admin/rescuers/${id}/approve`);
      setPending((prev) => prev.filter((p) => p.id !== id));
      toast.success('Rescatista aprobado');
    } catch {
      toast.error('Error al aprobar el rescatista');
    }
  }

  async function handleReject(id: string) {
    try {
      await api.patch(`/admin/rescuers/${id}/reject`);
      setPending((prev) => prev.filter((p) => p.id !== id));
      toast.success('Rescatista rechazado');
    } catch {
      toast.error('Error al rechazar el rescatista');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <p className="text-muted-foreground">Aprueba o rechaza a los rescatistas registrados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-yellow-500" />
            Rescatistas pendientes de aprobación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No hay rescatistas pendientes por revisar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((profile) => (
                <div key={profile.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {profile.organizationName ?? profile.user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.user.name} · {profile.user.email}
                        {profile.user.phone && ` · ${profile.user.phone}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.city}, {profile.country}
                      </p>
                      {profile.description && (
                        <p className="mt-1 text-sm line-clamp-2 text-muted-foreground">
                          {profile.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" onClick={() => handleApprove(profile.id)}>
                        Aprobar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(profile.id)}>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                  <Separator className="mt-3" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
