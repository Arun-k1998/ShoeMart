const mongoose = require('mongoose')

const Categoires = mongoose.Schema({
    Title:{
       type : String,
       required : true 
    },
    Description :{
        type : String,
        required: true
    },
    is_delete:{
        type:Boolean,
        default:false
    },
    image:{
        type: String,
        required:true
    }

});
module.exports = mongoose.model("category",Categoires)
// module.exports = mongoose.model('Categorie',Categoires)