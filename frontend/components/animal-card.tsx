'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Ruler, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import type { Animal } from '@/lib/types';

const SIZE_LABEL: Record<string, string> = {
  PEQUENO: 'Pequeño',
  MEDIANO: 'Mediano',
  GRANDE: 'Grande',
};

const SPECIES_LABEL: Record<string, string> = {
  PERRO: 'Perro',
  GATO: 'Gato',
  OTRO: 'Otro',
};

export function AnimalCard({ animal }: { animal: Animal }) {
  const primary = animal.images.find((i) => i.isPrimary) ?? animal.images[0];

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative h-48 bg-muted">
        {primary ? (
          <Image
            src={primary.url}
            alt={animal.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Heart className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <Badge className="absolute top-2 right-2" variant="secondary">
          {SPECIES_LABEL[animal.species]}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight">{animal.name}</h3>
          <span className="shrink-0 text-xs text-muted-foreground">
            {animal.gender === 'MACHO' ? 'Macho' : 'Hembra'}
          </span>
        </div>
        <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {animal.city}
          </span>
          <span className="flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            {SIZE_LABEL[animal.size]}
          </span>
          {animal.ageMonths != null && (
            <span>
              {animal.ageMonths < 12
                ? `${animal.ageMonths} meses`
                : `${Math.floor(animal.ageMonths / 12)} años`}
            </span>
          )}
        </div>
        <Link
          href={`/animals/${animal.id}`}
          className={buttonVariants({ size: 'sm', className: 'w-full' })}
        >
          Ver más
        </Link>
      </CardContent>
    </Card>
  );
}
