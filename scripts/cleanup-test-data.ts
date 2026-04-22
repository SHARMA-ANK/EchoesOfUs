import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up test data...');

    await prisma.user.deleteMany({
        where: {
            email: {
                in: ['test@example.com', 'migration@echoes-of-us.local'],
            },
        },
    });

    console.log('Test data cleaned up successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
