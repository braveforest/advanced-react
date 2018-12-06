const { Query } = require('./Query');
const { Mutation } = require('./Mutation');
const TypeResolvers  = require('./types');

const resolvers = {
    Query,
    Mutation,
    ...TypeResolvers
};

module.exports = {
    resolvers
};