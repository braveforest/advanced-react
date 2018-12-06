const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../utils/mail');
const { hasPermission } = require('../utils/hasPermission');
const stripe = require('../utils/stripe');

const Mutation = {
    createItem: async (parent, args, ctx) => {
        const item = await ctx.db.createItem({
            // This is how to create a relationship between the Item and the User
            user: {
                connect: {
                    id: ctx.request.userId,
                },
            },
            ...args,
        });
        return item;
    },
    updateItem: (parent, args, ctx) => {
        // first take a copy of the updates
        const updates = { ...args };
        // remove the ID from the updates
        delete updates.id;
        // run the update method
        return ctx.db.updateItem({
            data: updates,
            where: {
                id: args.id,
            },
        });
    },
    deleteItem: async (parent, args, ctx) => {
        const where = { id: args.id };
        // 1. find the item
        const item = await ctx.db.item(where).$fragment(`{ id title user { id }}`);

        // 2. Check if they own that item, or have the permissions
        const ownsItem = item.user.id === ctx.request.userId;
        const hasPermissions = ctx.request.user.permissions.some(permission =>
            ['ADMIN', 'ITEMDELETE'].includes(permission)
        );

        if (!ownsItem && !hasPermissions) {
            throw new Error("You don't have permission to do that!");
        }

        // 3. Delete it!
        return ctx.db.deleteItem(where);
    },
    signup: async (parent, args, ctx) => {
        // lowercase their email
        args.email = args.email.toLowerCase();
        // hash their password
        const password = await bcrypt.hash(args.password, 10);
        // create the user in the database
        const user = await ctx.db.createUser({
            ...args,
            password,
            permissions: { set: ['USER'] },
        });
        // create the JWT token for them
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        // We set the jwt as a cookie on the response
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
        });
        // Finalllllly we return the user to the browser
        return user;
    },
    signin: async (parent, { email, password }, ctx) => {
        // 1. check if there is a user with that email
        const user = await ctx.db.user({ email });

        if (!user) {
            throw new Error(`No such user found for email ${email}`);
        }
        // 2. Check if their password is correct
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new Error('Invalid Password!');
        }
        // 3. generate the JWT Token
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        // 4. Set the cookie with the token
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        // 5. Return the user
        return user;
    },
    signout: (parent, args, ctx) => {
        ctx.response.clearCookie('token');
        return { message: 'Goodbye!' };
    },
    requestReset: async (parent, args, ctx) => {
        // 1. Check if this is a real user
        const user = await ctx.db.user({ email: args.email });
        if (!user) {
            throw new Error(`No such user found for email ${args.email}`);
        }
        // 2. Set a reset token and expiry on that user
        const randomBytesPromiseified = promisify(randomBytes);
        const resetToken = (await randomBytesPromiseified(20)).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
        const res = await ctx.db.updateUser({
            data: { resetToken, resetTokenExpiry },
            where: { email: args.email },
        });
        // 3. Email them that reset token
        const mailRes = await transport.sendMail({
            from: 'wes@wesbos.com',
            to: user.email,
            subject: 'Your Password Reset Token',
            html: makeANiceEmail(`Your Password Reset Token is here!
            \n\n
            <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click Here to Reset</a>`),
        });

        // 4. Return the message
        return { message: 'Thanks!' };
    },
    resetPassword: async (parent, args, ctx) => {
        // 1. check if the passwords match
        if (args.password !== args.confirmPassword) {
            throw new Error("Yo Passwords don't match!");
        }
        // 2. check if its a legit reset token
        // 3. Check if its expired
        const [user] = await ctx.db.users({
            where: {
                resetToken: args.resetToken,
                resetTokenExpiry_gte: Date.now() - 3600000,
            }
        });
        if (!user) {
            throw new Error('This token is either invalid or expired!');
        }
        // 4. Hash their new password
        const password = await bcrypt.hash(args.password, 10);
        // 5. Save the new password to the user and remove old resetToken fields
        const updatedUser = await ctx.db.updateUser({
            data: {
                password,
                resetToken: null,
                resetTokenExpiry: null,
            },
            where: { email: user.email },
        });
        // 6. Generate JWT
        const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
        // 7. Set the JWT cookie
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        // 8. return the new user
        return updatedUser;
    },
    updatePermissions: async (parent, args, ctx) => {
        // 1. Query the current user
        const currentUser = await ctx.db.user({ id: ctx.request.userId });
        // 2. Check if they have permissions to do this
        hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
        // 3. Update the permissions
        return ctx.db.updateUser({
            data: {
                permissions: {
                    set: args.permissions,
                },
            },
            where: {
                id: args.userId,
            },
        });
    },
    addToCart: async (parent, args, ctx) => {
        // 1. Make sure they are signed in
        const { userId } = ctx.request;
        // 2. Query the users current cart
        const [existingCartItem] = await ctx.db.cartItems({
            where: {
                user: { id: userId },
                item: { id: args.id },
            },
        });
        // 3. Check if that item is already in their cart and increment by 1 if it is
        if (existingCartItem) {
            return ctx.db.updateCartItem({
                where: { id: existingCartItem.id },
                data: { quantity: existingCartItem.quantity + 1 },
            });
        }
        // 4. If its not, create a fresh CartItem for that user!
        return ctx.db.createCartItem({
            user: {
                connect: { id: userId },
            },
            item: {
                connect: { id: args.id },
            },
        });
    },
    removeFromCart: async (parent, args, ctx) => {
        // 1. Find the cart item
        const cartItem = await ctx.db.cartItem({ id: args.id }).$fragment(`{ id user { id } }`);
        // 1.5 Make sure we found an item
        if (!cartItem) throw new Error('No CartItem Found!');
        // 2. Make sure they own that cart item
        if (cartItem.user.id !== ctx.request.userId) {
            throw new Error('Cheatin huhhhh');
        }
        // 3. Delete that cart item
        return ctx.db.deleteCartItem({ id: args.id });
    },
    createOrder: async (parent, args, ctx) => {
        // 1. Query the current user and make sure they are signed in
        const { userId } = ctx.request;

        const user = await ctx.db.user({ id: userId })
        .$fragment(`{
            id
            name
            email
            cart {
                id
                quantity
                item { title price id description image largeImage }
            }
        }`);
        // 2. recalculate the total for the price
        const amount = user.cart.reduce(
            (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
            0
        );
        // 3. Create the stripe charge (turn token into $$$)
        const charge = await stripe.charges.create({
            amount,
            currency: 'USD',
            source: args.token,
        });
        // 4. Convert the CartItems to OrderItems
        const orderItems = user.cart.map(cartItem => {
            const orderItem = {
                ...cartItem.item,
                quantity: cartItem.quantity,
                user: { connect: { id: userId } },
            };
            delete orderItem.id;
            return orderItem;
        });

        // 5. create the Order
        const order = await ctx.db.createOrder({
            total: charge.amount,
            charge: charge.id,
            items: { create: orderItems },
            user: { connect: { id: userId } },
        });
        // 6. Clean up - clear the users cart, delete cartItems
        const cartItemIds = user.cart.map(cartItem => cartItem.id);
        await ctx.db.deleteManyCartItems({ id_in: cartItemIds });
        // 7. Return the Order to the client
        return order;
    },

};

module.exports = {
    Mutation
};