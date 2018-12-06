const { GraphQLServer } = require('graphql-yoga');
const { Prisma } = require('../generated/prisma-client');
const binding = require('prisma-binding');
const { resolvers } = require('../resolvers');
const { middlewares } = require('../middlewares');

const endpoint = process.env.PRISMA_ENDPOINT || 'http://localhost:4466';

const db = new Prisma({ endpoint });

const prisma = new binding.Prisma({
    typeDefs: 'src/generated/prisma.graphql',
    endpoint
});

function createServer() {
    return new GraphQLServer({
        typeDefs: 'src/schema.graphql',
        resolvers,
        middlewares,
        context: request => ({
            ...request,
            prisma,
            db
        }),
    });
}

module.exports = createServer;