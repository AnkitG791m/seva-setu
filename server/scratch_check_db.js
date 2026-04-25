import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.needReport.count();
  console.log('NeedReport count:', count);
  const needs = await prisma.needReport.findMany();
  console.log('Needs:', JSON.stringify(needs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
