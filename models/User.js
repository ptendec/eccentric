const {Schema, model, Types} = require('mongoose');

const schema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    address:{
        type: String,
        required: true
    },
    telephone:{
        type: String,
        required: true
    },
    links:[{
        type: Types.ObjectId,
        ref: 'Link'
    }]
})

module.exports = model('User', schema)