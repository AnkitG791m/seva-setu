import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database...');
  await prisma.feedback.deleteMany();
  await prisma.task.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.needReport.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const coordinator = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'rajesh@sevasetu.org',
      role: 'COORDINATOR',
      firebase_uid: 'coord_1',
    },
  });

  const vol1 = await prisma.user.create({
    data: {
      name: 'Amit Singh',
      email: 'amit@gmail.com',
      role: 'VOLUNTEER',
      firebase_uid: 'vol_1',
    },
  });

  const vol2 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@outlook.com',
      role: 'VOLUNTEER',
      firebase_uid: 'vol_2',
    },
  });

  const worker = await prisma.user.create({
    data: {
      name: 'Suresh Raina',
      email: 'suresh@sevasetu.org',
      role: 'FIELD_WORKER',
      firebase_uid: 'worker_1',
    },
  });

  console.log('Seeding volunteers...');
  const v1 = await prisma.volunteer.create({
    data: {
      userId: vol1.id,
      skills: 'First Aid, Driving',
      preferred_zones: 'North Delhi, West Delhi',
      lat: 28.7041,
      lng: 77.1025,
      avg_rating: 4.8,
    },
  });

  const v2 = await prisma.volunteer.create({
    data: {
      userId: vol2.id,
      skills: 'Teaching, Counseling',
      preferred_zones: 'South Delhi, Gurugram',
      lat: 28.4595,
      lng: 77.0266,
      avg_rating: 4.5,
    },
  });

  console.log('Seeding need reports...');
  const need1 = await prisma.needReport.create({
    data: {
      title: 'Medical Emergency: Oxygen Required',
      description: 'An elderly patient in Rohini Sector 7 needs an oxygen concentrator urgently. Family is unable to find one.',
      category: 'MEDICAL',
      location: 'Rohini, Sector 7, Delhi',
      lat: 28.7041,
      lng: 77.1025,
      urgency_score: 95,
      priority_label: 'CRITICAL',
      status: 'ASSIGNED',
      people_affected: 1,
    },
  });

  const need2 = await prisma.needReport.create({
    data: {
      title: 'Food Crisis in Slum Area',
      description: 'Around 50 families in Okhla Phase 3 are running out of dry rations due to local flooding.',
      category: 'FOOD',
      location: 'Okhla Phase 3, New Delhi',
      lat: 28.5355,
      lng: 77.2639,
      urgency_score: 75,
      priority_label: 'HIGH',
      status: 'OPEN',
      people_affected: 50,
    },
  });

  const need3 = await prisma.needReport.create({
    data: {
      title: 'Shelter for Homeless during Cold Wave',
      description: 'Blankets and temporary shelter needed for 20 people near Kashmere Gate ISBT.',
      category: 'SHELTER',
      location: 'Kashmere Gate, Delhi',
      lat: 28.6675,
      lng: 77.2282,
      urgency_score: 85,
      priority_label: 'CRITICAL',
      status: 'OPEN',
      people_affected: 20,
    },
  });

  console.log('Seeding tasks...');
  await prisma.task.create({
    data: {
      needReportId: need1.id,
      volunteerId: v1.id,
      status: 'ACCEPTED',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
