const CartItem = {
    item: (parent, args, ctx) => ctx.db.cartItem({ id: parent.id }).item(),
};

module.exports = {
    CartItem
};