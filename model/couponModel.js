const mongoose = require('mongoose')

const couponSchema = mongoose.Schema({
    couponCode:{
        type: String,
        required:true
    },
    discount:{
        type:Number
    },
    minimumAmount:{
        type: Number
    },
    maximumAmount:{
        type: Number
    },
    expiryDate:{
        type:Date
    },
    is_delete:{
        type: Boolean,
        default:false
    },
    users:[
        mongoose.Schema.Types.ObjectId
    ]
    

},{timestamps:true})

module.exports = mongoose.model('Coupon',couponSchema)