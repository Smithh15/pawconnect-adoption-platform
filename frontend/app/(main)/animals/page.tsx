'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AnimalCard } from '@/components/animal-card';
import { api } from '@/lib/api';
import type { PaginatedAnimals } from '@/lib/types';

function AnimalsPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [data, setData] = useState<PaginatedAnimals | null>(null);
  const [loading, setLoading] = useState(true);

  const [species, setSpecies] = useState(params.get('species') ?? '');
  const [size, setSize] = useState(params.get('size') ?? '');
  const [gender, setGender] = useState(params.get('gender') ?? '');
  const [city, setCity] = useState(params.get('city') ?? '');
  const [page, setPage] = useState(Number(params.get('page') ?? 1));

  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (species) query.set('species', species);
      if (size) query.set('size', size);
      if (gender) query.set('gender', gender);
      if (city) query.set('city', city);
      query.set('page', String(page));
      query.set('limit', '12');

      const res = await api.get<PaginatedAnimals>(`/animals?${query}`);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [species, size, gender, city, page]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  function handleFilter() {
    setPage(1);
    const query = new URLSearchParams();
    if (species) query.set('species', species);
    if (size) query.set('size', size);
    if (gender) query.set('gender', gender);
    if (city) query.set('city', city);
    router.push(`/animals?${query}`);
  }

  function handleClear() {
    setSpecies('');
    setSize('');
    setGender('');
    setCity('');
    setPage(1);
    router.push('/animals');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Animales en adopción</h1>
        <p className="text-muted-foreground">Encuentra tu compañero perfecto</p>
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select value={species} onValueChange={(v) => setSpecies(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Especie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERRO">Perro</SelectItem>
              <SelectItem value="GATO">Gato</SelectItem>
              <SelectItem value="OTRO">Otro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={size} onValueChange={(v) => setSize(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Tamaño" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PEQUENO">Pequeño</SelectItem>
              <SelectItem value="MEDIANO">Mediano</SelectItem>
              <SelectItem value="GRANDE">Grande</SelectItem>
            </SelectContent>
          </Select>

          <Select value={gender} onValueChange={(v) => setGender(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MACHO">Macho</SelectItem>
              <SelectItem value="HEMBRA">Hembra</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ciudad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="pl-8"
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleFilter} className="flex-1">Buscar</Button>
            <Button variant="outline" onClick={handleClear}>Limpiar</Button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-lg font-medium">No se encontraron animales</p>
          <p className="text-sm text-muted-foreground">
            Intenta cambiar los filtros de búsqueda
          </p>
          <Button variant="outline" onClick={handleClear}>Ver todos</Button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {data.meta.total} animal{data.meta.total !== 1 ? 'es' : ''} encontrado{data.meta.total !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.data.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>

          {/* Paginación */}
          {data.meta.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AnimalsPageWrapper() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="h-96 animate-pulse rounded-lg bg-muted" /></div>}>
      <AnimalsPage />
    </Suspense>
  );
}
