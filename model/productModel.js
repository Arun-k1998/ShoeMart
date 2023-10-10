// const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');


const productSchema = mongoose.Schema({
    name: {
        type : String ,
        trim : true,
        required : true
    },
    description: {
        type : String,
        trim: true,
        required : true
    },
    price: {
        type :Number,
        required : true
    },
    image:[{
        type :String ,
        required : true
    }],
    category:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'category',
        required : true
    },
    // sizes: {
    //     type:[{
    //         type: [String],
    //         enum : ['UK 6','UK 6.5','UK 7','UK 7.5','UK 8','UK 8.5','UK 9','UK 9.5','UK 10']
    //     }],
    //     required: true
    // }
    // sizes:[{
    //     type: String,
    //     enum : ['UK 6','UK 6.5','UK 7','UK 7.5','UK 8','UK 8.5','UK 9','UK 9.5','UK 10']
    // }]
    sizes: {
        type : String,
        enum : ['UK 6','UK 6.5','UK 7','UK 7.5','UK 8','UK 8.5','UK 9','UK 9.5','UK 10'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    is_delete:{
        type: Boolean,
        default: false
    },
    gender:{
        type: String,
        
    },
    reviews:[{
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        userReview:{
            type:String
        },
        createdDate:{
            type:Date,
            default: new Date().toLocaleString()
        }
    }]
    
},{
    timestamps:true
})

module.exports = mongoose.model('Product',productSchema)