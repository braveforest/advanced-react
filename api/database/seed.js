const { prisma } = require('../src/generated/prisma-client');
const bcrypt = require('bcryptjs');

async function main() {
    
    const password = await bcrypt.hash('123456', 10);
    await prisma.createUser({
        email: 'braveforest92@gmail.com',
        name: 'vincent',
        permissions: { set: ['USER', 'ADMIN'] },
        password,
    });

}


main();