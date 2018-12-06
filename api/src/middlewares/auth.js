const isAuthenticated = async (resolve, parent, args, ctx, info) => {
    
    if (!ctx.request.userId) {
        throw new Error('Not authorized');
    }

    return resolve();
};

const auth = {
    Query: {
        users: isAuthenticated,
        order: isAuthenticated,
        orders: isAuthenticated,
    },
    Mutation: {
        createItem: isAuthenticated,
        updatePermissions: isAuthenticated,
        addToCart: isAuthenticated,
        createOrder: isAuthenticated,
    }
};

module.exports = auth;