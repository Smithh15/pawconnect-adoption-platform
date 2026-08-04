import {
  PrismaClient,
  RescuerStatus,
  Species,
  AnimalSize,
  Gender,
  AnimalStatus,
  RequestStatus,
  type Animal,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_PASSWORD_HASH = bcrypt.hashSync('demo1234', 10);

async function resetDemoData(emails: string[]) {
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    include: { rescuerProfile: true },
  });

  const adopter = users.find((u) => u.email === 'demo@pawconnect.com');
  const profileIds = users
    .map((u) => u.rescuerProfile?.id)
    .filter((id): id is string => !!id);

  if (adopter) {
    await prisma.adoptionRequest.deleteMany({ where: { adopterId: adopter.id } });
  }

  if (profileIds.length > 0) {
    await prisma.adoptionRequest.deleteMany({
      where: { animal: { rescuerId: { in: profileIds } } },
    });
    await prisma.animal.deleteMany({ where: { rescuerId: { in: profileIds } } });
  }
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Faltan SEED_ADMIN_EMAIL y/o SEED_ADMIN_PASSWORD en el entorno. Definelas en tu .env antes de correr el seed.',
    );
  }

  await resetDemoData([
    'demo@pawconnect.com',
    'fundacion@pawconnect.com',
    'contacto@patitasfelices.org',
    adminEmail,
  ]);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      name: 'Administrador PawConnect',
      role: 'ADMIN',
    },
  });

  const adopter = await prisma.user.upsert({
    where: { email: 'demo@pawconnect.com' },
    update: { password: DEMO_PASSWORD_HASH },
    create: {
      email: 'demo@pawconnect.com',
      password: DEMO_PASSWORD_HASH,
      name: 'Camila Torres',
      phone: '3001234567',
      role: 'ADOPTANTE',
    },
  });

  const rescuerUser1 = await prisma.user.upsert({
    where: { email: 'fundacion@pawconnect.com' },
    update: { password: DEMO_PASSWORD_HASH },
    create: {
      email: 'fundacion@pawconnect.com',
      password: DEMO_PASSWORD_HASH,
      name: 'Andrea Ramírez',
      phone: '3109876543',
      role: 'RESCATISTA',
    },
  });

  const rescuerProfile1 = await prisma.rescuerProfile.upsert({
    where: { userId: rescuerUser1.id },
    update: { status: RescuerStatus.APPROVED, approvedById: admin.id, approvedAt: new Date() },
    create: {
      userId: rescuerUser1.id,
      organizationName: 'Fundación Huellas de Esperanza',
      description:
        'Rescatamos y rehabilitamos perros y gatos en situación de calle en Bogotá desde 2015. Trabajamos con veterinarios aliados para asegurar que cada animal llegue esterilizado y vacunado a su nuevo hogar.',
      city: 'Bogotá',
      country: 'Colombia',
      website: 'https://huellasdeesperanza.example.org',
      status: RescuerStatus.APPROVED,
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });

  const rescuerUser2 = await prisma.user.upsert({
    where: { email: 'contacto@patitasfelices.org' },
    update: {},
    create: {
      email: 'contacto@patitasfelices.org',
      password: DEMO_PASSWORD_HASH,
      name: 'Julián Restrepo',
      phone: '3201122334',
      role: 'RESCATISTA',
    },
  });

  const rescuerProfile2 = await prisma.rescuerProfile.upsert({
    where: { userId: rescuerUser2.id },
    update: { status: RescuerStatus.APPROVED, approvedById: admin.id, approvedAt: new Date() },
    create: {
      userId: rescuerUser2.id,
      organizationName: 'Refugio Patitas Felices',
      description:
        'Refugio sin ánimo de lucro en Medellín enfocado en el rescate de animales abandonados o maltratados. Todo animal publicado ha pasado por revisión veterinaria y periodo de adaptación.',
      city: 'Medellín',
      country: 'Colombia',
      website: 'https://patitasfelices.example.org',
      status: RescuerStatus.APPROVED,
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });

  const animalsData = [
    {
      rescuerId: rescuerProfile1.id,
      name: 'Rocco',
      species: Species.PERRO,
      breed: 'Labrador mestizo',
      ageMonths: 24,
      size: AnimalSize.MEDIANO,
      gender: Gender.MACHO,
      city: 'Bogotá',
      description:
        'Rocco es un perro juguetón y muy sociable que se lleva bien con niños y otros perros. Fue rescatado de la calle hace un año y ya está listo para tener un hogar definitivo.',
      healthNotes: 'Esterilizado, vacunas al día.',
      vaccinated: true,
      sterilized: true,
      imageUrl: 'https://placedog.net/640/480?id=15',
    },
    {
      rescuerId: rescuerProfile1.id,
      name: 'Luna',
      species: Species.GATO,
      breed: 'Criolla',
      ageMonths: 8,
      size: AnimalSize.PEQUENO,
      gender: Gender.HEMBRA,
      city: 'Bogotá',
      description:
        'Luna es una gatita curiosa y cariñosa, ideal para apartamento. Le encanta dormir al sol y jugar con pelotas de estambre.',
      healthNotes: null,
      vaccinated: true,
      sterilized: false,
      imageUrl: 'https://cataas.com/cat/kitten?width=640&height=480',
    },
    {
      rescuerId: rescuerProfile1.id,
      name: 'Max',
      species: Species.PERRO,
      breed: 'Criollo',
      ageMonths: 36,
      size: AnimalSize.GRANDE,
      gender: Gender.MACHO,
      city: 'Bogotá',
      description:
        'Max es tranquilo, obediente y muy leal. Ya sabe caminar con correa y responde a comandos básicos de obediencia.',
      healthNotes: 'Esterilizado.',
      vaccinated: true,
      sterilized: true,
      imageUrl: 'https://placedog.net/640/480?id=27',
    },
    {
      rescuerId: rescuerProfile1.id,
      name: 'Mia',
      species: Species.GATO,
      breed: 'Angora mestiza',
      ageMonths: 14,
      size: AnimalSize.PEQUENO,
      gender: Gender.HEMBRA,
      city: 'Bogotá',
      description:
        'Mia es independiente pero muy afectuosa una vez toma confianza. Convive bien con otros gatos y se adapta rápido a espacios nuevos.',
      healthNotes: null,
      vaccinated: true,
      sterilized: true,
      imageUrl: 'https://cataas.com/cat/cute?width=640&height=480',
    },
    {
      rescuerId: rescuerProfile1.id,
      name: 'Toby',
      species: Species.PERRO,
      breed: 'Beagle mestizo',
      ageMonths: 6,
      size: AnimalSize.PEQUENO,
      gender: Gender.MACHO,
      city: 'Bogotá',
      description:
        'Toby es un cachorro lleno de energía que está aprendiendo sus primeros comandos. Necesita una familia activa que le dedique tiempo a su entrenamiento.',
      healthNotes: 'Primera dosis de vacunas aplicada, faltan refuerzos.',
      vaccinated: false,
      sterilized: false,
      imageUrl: 'https://placedog.net/640/480?id=8',
    },
    {
      rescuerId: rescuerProfile1.id,
      name: 'Nala',
      species: Species.PERRO,
      breed: 'Criolla',
      ageMonths: 18,
      size: AnimalSize.MEDIANO,
      gender: Gender.HEMBRA,
      city: 'Bogotá',
      description:
        'Nala es cariñosa, tranquila y le encanta echarse junto a las personas. Fue rescatada junto a su camada y es la última en buscar hogar.',
      healthNotes: 'Esterilizada, vacunas al día.',
      vaccinated: true,
      sterilized: true,
      imageUrl: 'https://placedog.net/640/480?id=33',
    },
    {
      rescuerId: rescuerProfile2.id,
      name: 'Simón',
      species: Species.GATO,
      breed: 'Criollo',
      ageMonths: 30,
      size: AnimalSize.MEDIANO,
      gender: Gender.MACHO,
      city: 'Medellín',
      description:
        'Simón es un gato adulto tranquilo, perfecto para quienes buscan un compañero de bajo mantenimiento. Ya está acostumbrado a arenero y rascador.',
      healthNotes: 'Esterilizado.',
      vaccinated: true,
      sterilized: true,
      imageUrl: 'https://cataas.com/cat?width=640&height=480',
    },
    {
      rescuerId: rescuerProfile2.id,
      name: 'Coco',
      species: Species.PERRO,
      breed: 'Schnauzer mestiza',
      ageMonths: 10,
      size: AnimalSize.PEQUENO,
      gender: Gender.HEMBRA,
      city: 'Medellín',
      description:
        'Coco es alegre y muy apegada a las personas. Le gusta pasear y aprende rápido nuevas rutinas.',
      healthNotes: null,
      vaccinated: true,
      sterilized: false,
      imageUrl: 'https://placedog.net/640/480?id=41',
    },
    {
      rescuerId: rescuerProfile2.id,
      name: 'Thor',
      species: Species.PERRO,
      breed: 'Mastín mestizo',
      ageMonths: 48,
      size: AnimalSize.GRANDE,
      gender: Gender.MACHO,
      city: 'Medellín',
      description:
        'Thor es un perro grande, calmado y protector. Fue entregado al refugio por cambio de vivienda de su familia anterior y busca un espacio con patio.',
      healthNotes: 'Esterilizado, control de peso en curso.',
      vaccinated: true,
      sterilized: true,
      imageUrl: 'https://placedog.net/640/480?id=52',
    },
    {
      rescuerId: rescuerProfile2.id,
      name: 'Pelusa',
      species: Species.GATO,
      breed: 'Criolla',
      ageMonths: 5,
      size: AnimalSize.PEQUENO,
      gender: Gender.HEMBRA,
      city: 'Medellín',
      description:
        'Pelusa es una gatita juguetona rescatada junto a su camada. Se lleva bien con niños y otras mascotas ya presentadas con cuidado.',
      healthNotes: null,
      vaccinated: false,
      sterilized: false,
      imageUrl: 'https://cataas.com/cat/small?width=640&height=480',
    },
  ];

  const animals: Animal[] = [];
  for (const data of animalsData) {
    const { imageUrl, ...animalFields } = data;
    const animal = await prisma.animal.create({
      data: {
        ...animalFields,
        images: {
          create: {
            url: imageUrl,
            publicId: `seed/${data.name.toLowerCase()}`,
            isPrimary: true,
          },
        },
      },
    });
    animals.push(animal);
  }

  const rocco = animals.find((a) => a.name === 'Rocco')!;
  const nala = animals.find((a) => a.name === 'Nala')!;
  const toby = animals.find((a) => a.name === 'Toby')!;

  await prisma.animal.update({
    where: { id: rocco.id },
    data: { status: AnimalStatus.ADOPTADO },
  });
  await prisma.adoptionRequest.create({
    data: {
      animalId: rocco.id,
      adopterId: adopter.id,
      motivation:
        'Tengo experiencia con perros grandes, vivo en casa con patio y quiero darle a Rocco un hogar definitivo.',
      status: RequestStatus.FINALIZADA,
      reviewNote: 'Adopción completada. ¡Rocco ya está en su nuevo hogar!',
      reviewedAt: new Date(),
    },
  });

  await prisma.animal.update({
    where: { id: nala.id },
    data: { status: AnimalStatus.EN_PROCESO },
  });
  await prisma.adoptionRequest.create({
    data: {
      animalId: nala.id,
      adopterId: adopter.id,
      motivation:
        'Vivo sola en apartamento pero tengo horarios flexibles y experiencia previa cuidando perros medianos.',
      status: RequestStatus.APROBADA,
      reviewNote: 'Solicitud aprobada, coordinaremos la entrega esta semana.',
      reviewedAt: new Date(),
    },
  });

  await prisma.adoptionRequest.create({
    data: {
      animalId: toby.id,
      adopterId: adopter.id,
      motivation:
        'Trabajo desde casa y puedo dedicarle tiempo al entrenamiento de un cachorro como Toby.',
      status: RequestStatus.PENDIENTE,
    },
  });

  console.log('Seed completado:');
  console.log(`  Admin:     ${admin.email}`);
  console.log('  Adoptante: demo@pawconnect.com / demo1234');
  console.log('  Fundación: fundacion@pawconnect.com / demo1234');
  console.log(`  Animales:  ${animals.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
