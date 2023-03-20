const mongoose = require('mongoose');


// const orderSchema = mongoose.Schema({
//     orderItems:[{ 
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'OrderItem',
//         required: true
//     }],
//     shippingAddress:{
//         type:String,
//         required: true
//     },
//     city: {
//         type: String,
//         required: true
//     },
//     zip: {
//         type : Number,
//         required: true
//     },
//     country:{
//         type: String,
//         required: true
//     },
//     status: {
//         type: String,
//         default: "pending"
//     },
//     totalPrice:{
//         type: Number,

//     },
//     user:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref:"User",

//     },
//     dateOrderd:{
//         type:Date,
//         dafault: Date.now
//     }
// });

const orderSchema = mongoose.Schema({   
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",

    },
    product:[{
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },quantity:{
            type : Number,
            required: true
        },size:{
            type: String,
            required: true              
        }
    }],
    paymentMethod:{
        type: String,
    },
    totalPrice:{
        type :Number,
        required: true
    },
    subTotal:{
        type:Number
    }
    ,
    orderStatus:{
        type : String,
        default : 'Placed',
        enum:['Placed','Processing','Shipped','Delivered','Returned','Cancelled']
    },
    paymentStatus:{
        type : String,
        default:'Pending',
        enum:['Pending','Charged','Refunded']
    },
    customer: {
        name:String,
        phoneNumber: Number,
        pincode: Number,
        locality:String,
        address:String,
        district:String,
        state:String
    },
    createdDate:{
        type:Date,
        default:Date.now
    },
    couponCode:{
        type: String,

    },
    discount:{
        type:Number
    }
})

module.exports= mongoose.model("Order",orderSchema)