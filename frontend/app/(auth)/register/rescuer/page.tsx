'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional(),
  city: z.string().min(2, 'La ciudad es requerida'),
  organizationName: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function RegisterRescuerPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        ...data,
        website: data.website || undefined,
        organizationName: data.organizationName || undefined,
        description: data.description || undefined,
        phone: data.phone || undefined,
      };
      await api.post('/auth/register/rescuer', payload);
      toast.success('¡Cuenta creada! Tu perfil está pendiente de aprobación por el administrador.');
      router.push('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al registrarse');
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle>Registrarse como Rescatista</CardTitle>
        <CardDescription>
          Crea tu cuenta para publicar animales en adopción. Tu perfil será
          revisado antes de ser aprobado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Datos personales */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Datos personales
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" placeholder="María García" {...register('name')} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Teléfono{' '}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input id="phone" placeholder="+57 300 123 4567" {...register('phone')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Datos de organización */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Información de rescatista
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" placeholder="Ej: Bogotá" {...register('city')} />
                {errors.city && (
                  <p className="text-xs text-destructive">{errors.city.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organizationName">
                  Nombre de organización{' '}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="organizationName"
                  placeholder="Ej: Patitas Felices"
                  {...register('organizationName')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">
                Descripción{' '}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Cuéntanos sobre tu labor de rescate..."
                rows={3}
                {...register('description')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">
                Sitio web{' '}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://tuorganizacion.com"
                {...register('website')}
              />
              {errors.website && (
                <p className="text-xs text-destructive">{errors.website.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta de rescatista'}
          </Button>
        </form>

        <div className="mt-4 space-y-1 text-center text-sm text-muted-foreground">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Iniciar sesión
            </Link>
          </p>
          <p>
            ¿Quieres adoptar?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Regístrate como adoptante
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
