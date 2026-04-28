import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  {
    name: 'Admin Coordinator',
    email: 'admin@sevasetu.app',
    password: 'SevaSetu@2026',
    role: 'COORDINATOR',
  },
  {
    name: 'Demo Volunteer',
    email: 'demo@sevasetu.app',
    password: 'Demo@12345',
    role: 'VOLUNTEER',
  },
  {
    name: 'Field Worker',
    email: 'field@sevasetu.app',
    password: 'Field@12345',
    role: 'FIELD_WORKER',
  },
];

async function seed() {
  console.log('🌱 Seeding users...');
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password_hash: hash,
        role: u.role,
      },
    });

    if (u.role === 'VOLUNTEER' || u.role === 'FIELD_WORKER') {
      await prisma.volunteer.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, skills: null, preferred_zones: null },
      });
    }

    console.log(`  ✅ ${u.role}: ${u.email} / ${u.password}`);
  }
  console.log('✅ Seed complete!');
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
