const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@pawconnect.com';
  const password = 'Admin1234';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin ya existe:', existing.id);
    return existing;
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email,
      password: hashed,
      role: 'ADMIN',
    },
    select: { id: true, email: true, role: true },
  });

  console.log('Admin creado:', JSON.stringify(admin));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
