'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Heart, Shield, Syringe, CheckCircle, User, ImagePlus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ImageCropDialog } from '@/components/image-crop-dialog';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Animal } from '@/lib/types';

const SIZE_LABEL: Record<string, string> = {
  PEQUENO: 'Pequeño',
  MEDIANO: 'Mediano',
  GRANDE: 'Grande',
};

export default function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<Animal>(`/animals/${id}`)
      .then((res) => setAnimal(res.data))
      .catch(() => router.push('/animals'))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleRequest() {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (motivation.trim().length < 30) {
      toast.error('La motivación debe tener al menos 30 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/adoption-requests', { animalId: id, motivation });
      toast.success('¡Solicitud enviada exitosamente!');
      setRequested(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!animal) return null;

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setCropImageSrc(URL.createObjectURL(file));
  }

  function closeCropDialog() {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleCropConfirm(blob: Blob) {
    const formData = new FormData();
    formData.append('file', blob, 'foto.jpg');
    setUploading(true);
    try {
      await api.post(`/animals/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = await api.get<Animal>(`/animals/${id}`);
      setAnimal(updated.data);
      toast.success('Foto subida');
      closeCropDialog();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    try {
      await api.delete(`/animals/${id}/images/${imageId}`);
      const updated = await api.get<Animal>(`/animals/${id}`);
      setAnimal(updated.data);
      setSelectedImage(0);
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar la foto');
    }
  }

  async function handleSetPrimary(imageId: string) {
    try {
      await api.patch(`/animals/${id}/images/${imageId}/primary`);
      const updated = await api.get<Animal>(`/animals/${id}`);
      setAnimal(updated.data);
      toast.success('Foto principal actualizada');
    } catch {
      toast.error('Error al actualizar la foto principal');
    }
  }

  const images = animal.images.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  const isAvailable = animal.status === 'DISPONIBLE';
  const isOwnAnimal = user && animal.rescuer.user.id === user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Imágenes + info */}
        <div className="space-y-6">
          {/* Galería */}
          <div className="space-y-2">
            <div className="relative h-80 w-full overflow-hidden rounded-xl bg-muted sm:h-96">
              {images[selectedImage] ? (
                <Image
                  src={images[selectedImage].url}
                  alt={animal.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Heart className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                      i === selectedImage ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info principal */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{animal.name}</h1>
              <Badge variant={isAvailable ? 'default' : 'secondary'}>
                {isAvailable ? 'Disponible' : animal.status === 'EN_PROCESO' ? 'En proceso' : 'Adoptado'}
              </Badge>
            </div>

            <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {animal.city}
              </span>
              <span>{animal.gender === 'MACHO' ? 'Macho' : 'Hembra'}</span>
              <span>{SIZE_LABEL[animal.size]}</span>
              {animal.species === 'PERRO' ? 'Perro' : animal.species === 'GATO' ? 'Gato' : 'Otro'}
              {animal.breed && <span>{animal.breed}</span>}
              {animal.ageMonths != null && (
                <span>
                  {animal.ageMonths < 12
                    ? `${animal.ageMonths} meses`
                    : `${Math.floor(animal.ageMonths / 12)} año${Math.floor(animal.ageMonths / 12) !== 1 ? 's' : ''}`}
                </span>
              )}
            </div>

            <div className="mb-4 flex gap-4">
              {animal.vaccinated && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <Syringe className="h-4 w-4" />
                  Vacunado
                </span>
              )}
              {animal.sterilized && (
                <span className="flex items-center gap-1.5 text-sm text-blue-600">
                  <Shield className="h-4 w-4" />
                  Esterilizado
                </span>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div>
                <h2 className="mb-1.5 font-semibold">Descripción</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{animal.description}</p>
              </div>
              {animal.healthNotes && (
                <div>
                  <h2 className="mb-1.5 font-semibold">Notas de salud</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{animal.healthNotes}</p>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              Publicado por{' '}
              <span className="font-medium text-foreground">
                {animal.rescuer.organizationName ?? animal.rescuer.user.name}
              </span>
              {' '}· {animal.rescuer.city}
            </div>
          </div>
        </div>

        {/* Sidebar adopción */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              {isOwnAnimal ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Tu animal publicado
                  </div>

                  {/* Fotos actuales */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {images.map((img) => (
                        <div key={img.id} className="group relative aspect-square overflow-hidden rounded-md bg-muted">
                          <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!img.isPrimary && (
                              <button
                                onClick={() => handleSetPrimary(img.id)}
                                className="rounded-full bg-white/20 p-1.5 hover:bg-white/40"
                                title="Hacer principal"
                              >
                                <Star className="h-4 w-4 text-white" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteImage(img.id)}
                              className="rounded-full bg-destructive/80 p-1.5 hover:bg-destructive"
                              title="Eliminar foto"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                          {img.isPrimary && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary/80 py-0.5 text-center text-[10px] text-white">
                              Principal
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subir foto */}
                  {images.length < 6 && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        {uploading ? 'Subiendo...' : `Subir foto (${images.length}/6)`}
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => router.push('/dashboard')}
                  >
                    Ver en dashboard
                  </Button>
                </div>
              ) : requested ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p className="font-medium">¡Solicitud enviada!</p>
                  <p className="text-sm text-muted-foreground">
                    El rescatista revisará tu solicitud pronto.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/dashboard')}
                  >
                    Ver mis solicitudes
                  </Button>
                </div>
              ) : isAvailable ? (
                <>
                  <h2 className="mb-4 font-semibold">Solicitar adopción</h2>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="motivation">
                        ¿Por qué quieres adoptar a {animal.name}?
                      </Label>
                      <Textarea
                        id="motivation"
                        placeholder="Cuéntanos sobre tu hogar, experiencia con animales y por qué crees que serías el/la adoptante ideal... (mínimo 30 caracteres)"
                        rows={5}
                        value={motivation}
                        onChange={(e) => setMotivation(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {motivation.length} / 30 caracteres mínimo
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleRequest}
                      disabled={submitting || !isAuthenticated()}
                    >
                      {!isAuthenticated()
                        ? 'Inicia sesión para adoptar'
                        : submitting
                        ? 'Enviando...'
                        : `Adoptar a ${animal.name}`}
                    </Button>
                    {!isAuthenticated() && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push('/login')}
                      >
                        Iniciar sesión
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground">
                  <Heart className="h-8 w-8 text-muted-foreground/50" />
                  <p>Este animal ya no está disponible para adopción</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ImageCropDialog
        imageSrc={cropImageSrc}
        onClose={closeCropDialog}
        onConfirm={handleCropConfirm}
        confirming={uploading}
      />
    </div>
  );
}
