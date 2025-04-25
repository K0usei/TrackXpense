const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Test the connection by querying the categories
    const categories = await prisma.category.findMany();
    console.log('Database connection successful!');
    console.log('Categories:', categories);
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
