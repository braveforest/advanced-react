const Order = {
    user: (parent, args, ctx) => ctx.db.order({ id: parent.id }).user(),
    items: (parent, args, ctx) => ctx.db.order({ id: parent.id }).items(),
};

module.exports = {
    Order
};