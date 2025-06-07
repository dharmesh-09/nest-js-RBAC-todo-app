import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user' },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: { name: 'manager' },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });

  // Clear existing permissions to avoid duplicates
  await prisma.permission.deleteMany({
    where: {
      roleId: { in: [userRole.id, managerRole.id, adminRole.id] },
    },
  });

  // Create permissions for user
  await prisma.permission.createMany({
    data: [
      { name: 'todo:read', roleId: userRole.id },
      { name: 'todo:write', roleId: userRole.id },
      { name: 'todo:delete', roleId: userRole.id },
    ],
  });

  // Create permissions for manager
  await prisma.permission.createMany({
    data: [
      { name: 'todo:read', roleId: managerRole.id },
      { name: 'todo:write', roleId: managerRole.id },
      { name: 'todo:delete', roleId: managerRole.id },
      { name: 'todo:read-all', roleId: managerRole.id },
    ],
  });

  // Create permissions for admin
  await prisma.permission.createMany({
    data: [
      { name: 'todo:read-all', roleId: adminRole.id },
      { name: 'todo:write-all', roleId: adminRole.id },
      { name: 'todo:delete-all', roleId: adminRole.id },
    ],
  });

  console.log('Seeded roles and permissions:', {
    userRole: { id: userRole.id, name: userRole.name },
    managerRole: { id: managerRole.id, name: managerRole.name },
    adminRole: { id: adminRole.id, name: adminRole.name },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });