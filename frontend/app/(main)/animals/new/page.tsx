'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Animal } from '@/lib/types';

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  species: z.enum(['PERRO', 'GATO', 'OTRO'], { message: 'Selecciona una especie' }),
  breed: z.string().optional(),
  ageMonths: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().int().min(0).optional()),
  size: z.enum(['PEQUENO', 'MEDIANO', 'GRANDE'], { message: 'Selecciona un tamaño' }),
  gender: z.enum(['MACHO', 'HEMBRA'], { message: 'Selecciona un género' }),
  city: z.string().min(1, 'La ciudad es requerida'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  healthNotes: z.string().optional(),
  vaccinated: z.boolean().optional(),
  sterilized: z.boolean().optional(),
});

type FormData = z.input<typeof schema>;

export default function NewAnimalPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
    else if (user?.role !== 'RESCATISTA') router.push('/dashboard');
  }, [isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vaccinated: false, sterilized: false },
  });

  const vaccinated = watch('vaccinated');
  const sterilized = watch('sterilized');

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        ...data,
        ageMonths: data.ageMonths === '' ? undefined : data.ageMonths,
        breed: data.breed || undefined,
        healthNotes: data.healthNotes || undefined,
      };
      const res = await api.post<Animal>('/animals', payload);
      toast.success('Animal publicado exitosamente');
      router.push(`/animals/${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al publicar el animal');
    }
  }

  if (!user || user.role !== 'RESCATISTA') return null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Publicar animal</h1>
          <p className="text-muted-foreground">Completa la información para publicar en adopción</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" placeholder="Ej: Luna" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="breed">Raza <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="breed" placeholder="Ej: Labrador, cruce..." {...register('breed')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Especie</Label>
                <Controller
                  name="species"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERRO">Perro</SelectItem>
                        <SelectItem value="GATO">Gato</SelectItem>
                        <SelectItem value="OTRO">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.species && <p className="text-xs text-destructive">{errors.species.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Tamaño</Label>
                <Controller
                  name="size"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEQUENO">Pequeño</SelectItem>
                        <SelectItem value="MEDIANO">Mediano</SelectItem>
                        <SelectItem value="GRANDE">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.size && <p className="text-xs text-destructive">{errors.size.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Género</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MACHO">Macho</SelectItem>
                        <SelectItem value="HEMBRA">Hembra</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ageMonths">Edad en meses <span className="text-muted-foreground">(opcional)</span></Label>
                <Input
                  id="ageMonths"
                  type="number"
                  min={0}
                  placeholder="Ej: 48 = 4 años"
                  {...register('ageMonths')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" placeholder="Ej: Bogotá" {...register('city')} />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descripción */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="description">Historia y personalidad</Label>
              <Textarea
                id="description"
                placeholder="Cuéntanos la historia del animal, su personalidad, comportamiento... (mínimo 20 caracteres)"
                rows={5}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="healthNotes">
                Notas de salud <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="healthNotes"
                placeholder="Tratamientos, condiciones especiales, medicación..."
                rows={3}
                {...register('healthNotes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Salud */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado de salud</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => setValue('vaccinated', !vaccinated)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  vaccinated
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${vaccinated ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                  {vaccinated && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                Vacunado/a
              </button>

              <button
                type="button"
                onClick={() => setValue('sterilized', !sterilized)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  sterilized
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${sterilized ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                  {sterilized && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                Esterilizado/a
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Publicando...' : 'Publicar animal'}
          </Button>
          <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
