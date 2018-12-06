const formatMoney = require('../../utils/formatMoney');

const Item = {
    displayPrice: parent => formatMoney(parent.price),
};

module.exports = {
    Item
};