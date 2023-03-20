const { Timestamp, ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const userDate = mongoose.Schema({
    firstName :{
        type : String,
        required : true
    },
    lastName :{
        type : String,
        required : true
    },
    email : {
        type : String, 
        required : true
    },
    phoneNumber : { 
        type : String,
        required : true
    },
    password : { 
        type : String,
         required : true
    },
    is_admin : {
        type : Number,
        default : 0
    },
    lastSent : { 
        type : String,
        required : true
    },
    isBlocked : {
        type : Boolean,
        default : false
    },
    cart:{
        items:[
            {
                productId : {
                    type: mongoose.Schema.Types.ObjectId,
                    ref:"Product",
                    required: true 
                },
                quantity: {
                    type: Number,
                    required: true,
                    
                },
                size:{
                    type: String,
                    required:true
                }
            }
        ],
        totalPrice:{
            type: Number,
            default : 0
        }
    },
    wishList:[
        {
            productId :{
                type:ObjectId,
                ref:'Product',
                required: true
            } 


        }
    ],
    shippingAddress:[
        {
            name:{
                type:String,
                required:true
            },
            phoneNumber:{
                type:Number,
                required:true
            },
            pinCode:{
                type: Number,
                required: true
            },
            locality:{
                type:String,
                required: true
            },
            address:{
                type:String,
                required:true
            },
            district:{
                type : String,

            },
            state:{
                type: String
            }


        }
    ]
}, { timestamps: true
}
)



module.exports = mongoose.model("User",userDate)