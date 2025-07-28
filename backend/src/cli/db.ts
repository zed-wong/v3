import { PrismaClient } from '../generated/prisma'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./db.sqlite3';
}

export const startDB = async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log(`Database connected to ${process.env.DATABASE_URL}`);
  return prisma;
};