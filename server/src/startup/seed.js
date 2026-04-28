import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_USERS = [
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

export async function seedDefaultUsers() {
  console.log('🌱 Checking default users...');
  for (const u of DEFAULT_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const hash = await bcrypt.hash(u.password, 10);
      const user = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          password_hash: hash,
          role: u.role,
        },
      });
      if (u.role === 'VOLUNTEER' || u.role === 'FIELD_WORKER') {
        await prisma.volunteer.create({
          data: { userId: user.id },
        });
      }
      console.log(`  ✅ Created: ${u.email} (${u.role})`);
    }
  }
  console.log('✅ Default users ready.');
}
