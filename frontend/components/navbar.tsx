'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PawPrint, LogOut, User, LayoutDashboard } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

export function Navbar() {
  const router = useRouter();
  const { user, clearAuth, isAuthenticated } = useAuthStore();

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Si la llamada falla (red, token ya vencido) igual cerramos la sesión localmente.
    }
    clearAuth();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <PawPrint className="h-6 w-6 text-primary" />
          PawConnect
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/animals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Adoptar
          </Link>

          {isAuthenticated() && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Mi perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Iniciar sesión
              </Link>
              <Link href="/register" className={buttonVariants({ size: 'sm' })}>
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
