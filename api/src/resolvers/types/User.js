const User = {
    cart: (parent, args, ctx) => ctx.db.user({ id: parent.id }).cart(),  
};

module.exports = {
    User
};