const {Schema, model, Types} = require('mongoose')
const Product = require('../models/Product')

const schema = new Schema({
    userId: {
        type: String,
        required: true
    },
    product: [{
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        brand: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        category:{
            type: String,
            required: true
        }
    }],
    size: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
})
module.exports = model('Basket', schema)