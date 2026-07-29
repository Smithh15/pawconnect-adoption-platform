'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { PlusCircle, Clock, Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { buttonVariants } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { Animal, AdoptionRequest } from '@/lib/types';

interface RescuerProfile {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  organizationName?: string;
  city: string;
}

export function RescuerDashboard() {
  const [profile, setProfile] = useState<RescuerProfile | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<RescuerProfile>('/rescuers/me')
      .then(async (profileRes) => {
        setProfile(profileRes.data);

        if (profileRes.data.status === 'APPROVED') {
          const [animalsRes, reqRes] = await Promise.all([
            api.get<{ data: Animal[] }>(`/animals?rescuerId=${profileRes.data.id}&limit=50`),
            api.get<AdoptionRequest[]>('/adoption-requests/rescuer'),
          ]);
          setAnimals(animalsRes.data.data);
          setRequests(reqRes.data);
        }
      })
      .catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    try {
      await api.patch(`/adoption-requests/${id}/approve`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'APROBADA' as const } : r)),
      );
      toast.success('Solicitud aprobada');
    } catch {
      toast.error('Error al aprobar la solicitud');
    }
  }

  async function handleReject(id: string) {
    try {
      await api.patch(`/adoption-requests/${id}/reject`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'RECHAZADA' as const } : r)),
      );
      toast.success('Solicitud rechazada');
    } catch {
      toast.error('Error al rechazar la solicitud');
    }
  }

  async function handleFinalize(id: string) {
    try {
      await api.patch(`/adoption-requests/${id}/finalize`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'FINALIZADA' as const } : r)),
      );
      toast.success('Adopción finalizada');
    } catch {
      toast.error('Error al finalizar');
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'PENDIENTE');
  const approvedRequests = requests.filter((r) => r.status === 'APROBADA');
  const availableAnimals = animals.filter((a) => a.status === 'DISPONIBLE');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (profile?.status === 'PENDING') {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <Clock className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold">Perfil pendiente de aprobación</h1>
        <p className="max-w-sm text-muted-foreground">
          Tu perfil de rescatista está siendo revisado por el administrador. Te
          notificaremos cuando sea aprobado para que puedas publicar animales.
        </p>
        <Link href="/profile" className={buttonVariants({ variant: 'outline' })}>
          Ver mi perfil
        </Link>
      </div>
    );
  }

  if (profile?.status === 'REJECTED') {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Perfil rechazado</h1>
        <p className="max-w-sm text-muted-foreground">
          Tu perfil de rescatista fue rechazado. Contacta al administrador para
          más información.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Rescatista</h1>
          <p className="text-muted-foreground">Gestiona tus animales y solicitudes</p>
        </div>
        <Link href="/animals/new" className={buttonVariants({ size: 'sm' })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Publicar animal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Heart className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{availableAnimals.length}</p>
              <p className="text-xs text-muted-foreground">Animales disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{pendingRequests.length}</p>
              <p className="text-xs text-muted-foreground">Solicitudes pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{approvedRequests.length}</p>
              <p className="text-xs text-muted-foreground">En proceso de adopción</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solicitudes pendientes */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Solicitudes pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">{req.animal.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Solicitante: <span className="text-foreground">{req.adopter.name}</span>
                      {req.adopter.phone && ` · ${req.adopter.phone}`}
                    </p>
                    <p className="mt-1 text-sm line-clamp-2 text-muted-foreground">
                      {req.motivation}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => handleApprove(req.id)}>
                      Aprobar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(req.id)}>
                      Rechazar
                    </Button>
                  </div>
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Solicitudes aprobadas */}
      {approvedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adopciones en proceso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedRequests.map((req) => (
              <div key={req.id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{req.animal.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {req.adopter.name} · {req.adopter.email}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleFinalize(req.id)}>
                    Marcar como adoptado
                  </Button>
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mis animales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis animales publicados</CardTitle>
        </CardHeader>
        <CardContent>
          {animals.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">No tienes animales publicados</p>
              <Link href="/animals/new" className={buttonVariants({ size: 'sm' })}>
                Publicar primer animal
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {animals.slice(0, 6).map((animal) => {
                const img = animal.images.find((i) => i.isPrimary) ?? animal.images[0];
                return (
                  <Link
                    key={animal.id}
                    href={`/animals/${animal.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {img && (
                        <Image src={img.url} alt={animal.name} fill className="object-cover" sizes="48px" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{animal.name}</p>
                      <p className="text-xs text-muted-foreground">{animal.city}</p>
                    </div>
                    <Badge
                      variant={animal.status === 'DISPONIBLE' ? 'secondary' : animal.status === 'ADOPTADO' ? 'default' : 'outline'}
                      className="ml-auto shrink-0 text-xs"
                    >
                      {animal.status === 'DISPONIBLE' ? 'Disponible' : animal.status === 'EN_PROCESO' ? 'En proceso' : animal.status === 'ADOPTADO' ? 'Adoptado' : 'No disponible'}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
