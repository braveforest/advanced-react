const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils/hasPermission');

const Query = {
    items: (parent, args, ctx) => ctx.db.items(args),
    item: (parent, { where: { id } }, ctx) => ctx.db.item({ id }),
    itemsConnection: forwardTo('prisma'),
    me: (parent, args, ctx) => {
        // check if there is a current user ID
        if(!ctx.request.userId) {
            return null;
        }
        return ctx.db.user({ id: ctx.request.userId});
    },
    users: async (parent, args, ctx) => {
        // 1. Check if the user has the permissions to query all the users
        hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);

        // 2. if they do, query all the users!
        return ctx.db.users();
    },
    order: async (parent, args, ctx) => {
        // 1. Query the current order
        const user = await ctx.db.order(args).user();
        // 3. Check if the have the permissions to see this order
        const ownsOrder = user.id === ctx.request.userId;
        const hasPermissionToSeeOrder = ctx.request.user.permissions.includes('ADMIN');
        if (!ownsOrder || !hasPermissionToSeeOrder) {
            throw new Error('You cant see this buddd');
        }
        // 4. Return the order
        return ctx.db.order(args);
    },
    orders: async (parent, args, ctx) => {
        const { userId } = ctx.request;
        return ctx.db.orders({ 
            where: {
                user: { id: userId },
            },
            ...args
        });
    },  
};

module.exports = {
    Query,
};