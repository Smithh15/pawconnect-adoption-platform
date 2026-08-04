export type Role = 'ADOPTANTE' | 'RESCATISTA' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type RescuerStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Species = 'PERRO' | 'GATO' | 'OTRO';
export type AnimalSize = 'PEQUENO' | 'MEDIANO' | 'GRANDE';
export type Gender = 'MACHO' | 'HEMBRA';
export type AnimalStatus = 'DISPONIBLE' | 'EN_PROCESO' | 'ADOPTADO' | 'NO_DISPONIBLE';
export type RequestStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA' | 'FINALIZADA';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AnimalImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface Animal {
  id: string;
  name: string;
  species: Species;
  breed?: string;
  ageMonths?: number;
  size: AnimalSize;
  gender: Gender;
  city: string;
  description: string;
  healthNotes?: string;
  vaccinated: boolean;
  sterilized: boolean;
  status: AnimalStatus;
  createdAt: string;
  images: AnimalImage[];
  rescuer: {
    id: string;
    organizationName?: string;
    city: string;
    user: { id: string; name: string };
  };
}

export interface PaginatedAnimals {
  data: Animal[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PendingRescuerProfile {
  id: string;
  organizationName?: string;
  description?: string;
  city: string;
  country: string;
  website?: string;
  status: RescuerStatus;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface AdoptionRequest {
  id: string;
  motivation: string;
  status: RequestStatus;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  animal: {
    id: string;
    name: string;
    species: Species;
    city: string;
    status: AnimalStatus;
    images: { url: string }[];
  };
  adopter: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}
