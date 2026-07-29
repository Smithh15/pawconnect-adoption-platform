'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Heart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { AdoptionRequest, RequestStatus } from '@/lib/types';

const STATUS_CONFIG: Record<RequestStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  APROBADA: { label: 'Aprobada', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  RECHAZADA: { label: 'Rechazada', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  CANCELADA: { label: 'Cancelada', variant: 'outline', icon: <XCircle className="h-3 w-3" /> },
  FINALIZADA: { label: 'Finalizada', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
};

export function AdopterDashboard() {
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<AdoptionRequest[]>('/adoption-requests/my')
      .then((res) => setRequests(res.data))
      .catch(() => toast.error('Error al cargar solicitudes'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(id: string) {
    try {
      await api.patch(`/adoption-requests/${id}/cancel`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'CANCELADA' as RequestStatus } : r)),
      );
      toast.success('Solicitud cancelada');
    } catch {
      toast.error('No se pudo cancelar la solicitud');
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis solicitudes</h1>
          <p className="text-muted-foreground">Historial de solicitudes de adopción</p>
        </div>
        <Link href="/animals" className={buttonVariants({ size: 'sm' })}>
          Buscar animales
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <Heart className="h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium">Aún no has enviado solicitudes</p>
          <p className="text-sm text-muted-foreground">
            Encuentra un animal y envía tu primera solicitud de adopción
          </p>
          <Link href="/animals" className={buttonVariants()}>
            Ver animales disponibles
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const config = STATUS_CONFIG[req.status];
            const img = req.animal.images[0];
            return (
              <Card key={req.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {img ? (
                      <Image src={img.url} alt={req.animal.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Heart className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{req.animal.name}</p>
                      <Badge variant={config.variant} className="flex items-center gap-1">
                        {config.icon}
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{req.animal.city}</p>
                    {req.reviewNote && (
                      <p className="mt-1 text-xs text-muted-foreground italic">"{req.reviewNote}"</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/animals/${req.animal.id}`}
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      Ver animal
                    </Link>
                    {(req.status === 'PENDIENTE' || req.status === 'APROBADA') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(req.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
