const users = require('../model/userModel')
const product = require('../model/productModel')
const category = require('../model/categoriesModel')
const order = require("../model/orderModel")
const { Reject } = require('twilio/lib/twiml/VoiceResponse')
const mongoose = require('mongoose')
const { updateOne, findOneAndUpdate } = require('../model/userModel')
const ObjectId = require('mongodb').ObjectID
const Razorpay = require('razorpay')
const coupon = require('../model/couponModel')

const {RAZORPAY_ID,RAZORPAY_SECRET} = process.env


const orderHistory =(req,res)=>{
    try {
        
        return new  Promise((resolve,reject)=>{
            try {
                const userData  = users.findById(req.session.user_id)
                const categoryData = category.find({is_delete:false})
                const orderData = order.find({user:req.session.user_id}).sort({createdDate: -1})
                const orderStaus = order.schema.path('orderStatus').enumValues
                Promise.all([userData,categoryData,orderData,orderStaus]).then(([userData,categoryData,orderData,orderStatus])=>{        
                    const formatedOrderDate = orderData.map((order)=>new Date(order.createdDate).toLocaleString())
                    res.render('orderHistory',{userData,categoryData,orderData,orderStatus,formatedOrderDate})
                    resolve()
                })
            } catch (error) {
                console.log(error.message)
                reject(error)
            }
           
        })
    } catch (error) {
        console.log(error.messge);
    }
}



const loadOrderDetails = (req,res)=>{
    const orderId = req.query.oid
    return new Promise((resolve,reject)=>{
        try {
            const userData = users.findById(req.session.user_id)
            const orderDetails = order.findById(orderId).populate({path:'product',populate:'productId'})
            console.log(orderDetails);
        Promise.all([userData,orderDetails]).then(([userData,orderDetails])=>{ 
            res.render('orderDetails',{userData,orderDetails})
            resolve()
        })
        } catch (error) {
            console.log(error.message)
            reject(error)
        }
        
    })
}

const cancelOrder = async(req,res)=>{
    try {
        const oId = req.body.oId
        await order.findByIdAndUpdate(oId,{
            $set:{
                orderStatus: 'Cancelled'
            }
        },{new:true}).exec((error,data)=>{
            if(error){
                console.log(error.message);
            }else{
                data.product.map(async(products)=>{
                    await  product.findOneAndUpdate({_id:products.productId},{$inc: {
                        "quantity": products.quantity,
                      }},{new:true})
               })

                res.json({success:true,orderStatus:data.orderStatus})
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

const returnOrder = async(req,res)=>{
    try {
        const oId = req.body.oId
        console.log(oId);
        await order.findByIdAndUpdate(oId,{
            $set:{
                orderStatus:'Returned',
                paymentStatus:'Refunded'
            }},{new:true}).exec((error,data)=>{
            if(error){
                console.log(error.message)
            }else{
                res.json({success:true,orderStatus:data.orderStatus})
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

const loadCheckOut = (req,res)=>{
    
       return new Promise((resolve,reject)=>{
        try {
           
            
           
                if(req.session.user_id){
                    const categoryData =  category.find({is_delete:false})
                    const userData =  users.findById(req.session.user_id).populate('cart.items.productId')
                    const orderData = order.findOne({user:userData._id})
                    Promise.all([categoryData,userData,orderData]).then(([categoryData,userData,orderData])=>{
                        console.log(orderData);
                        res.render('checkOut',{userData,categoryData,orderData})
                        resolve()
                    })
                }else{
                    res.redirect("/login")
                    resolve()
                }
           
           
            
        } catch (error) {
            console.log(error.message);
            reject(error)
        }
       }) 
}

const quantityCheck = async(req,res)=>{
    try {
        
    } catch (error) {
        console.log(error.message);
    }
}
const checkOut = async(req,res)=>{
    try {
        const newAddress = req.body.addressId ||''
        const userData = await users.findById(req.session.user_id)
        const cart = userData.cart
        const subTotal = cart.totalPrice
        const payment = req.body.payment
        const name = req.body.name
        const phoneNumber = req.body.phoneNumber
        const pinCode = req.body.pinCode
        const address = req.body.address
        const locality = req.body.locality
        const state = req.body.state
        const district = req.body.district
        const paymentMethod = req.body.payment
        if(!newAddress){
            const address = {
                name:req.body.name,
                phoneNumber:req.body.phoneNumber,
                pinCode:req.body.pinCode,
                locality:req.body.locality,
                address:req.body.address,
                district:req.body.district,
                state:req.body.state
            }
            await users.findOneAndUpdate({_id:req.session.user_id},{$push:{shippingAddress:{...address}}})
        }
        let totalPrice ;
        if(!req.session.coupon){
            req.session.coupon ={couponCode:undefined,discount:0}
            totalPrice = parseInt(subTotal)
        }else{
            
             totalPrice = subTotal- subTotal*(req.session.coupon.discount)/100
             console.log(totalPrice)
        }
        
        const orderData = new order({
            user:req.session.user_id,
            product:cart.items,
            paymentMethod:payment,
            subTotal:subTotal,
            totalPrice:totalPrice ,
            customer:{
                name,
                phoneNumber,
                pinCode,
                locality,
                address,
                district,
                state
            },
            couponCode: req.session.coupon.couponCode ? req.session.coupon.couponCode : undefined,
            discount:req.session.coupon.discount ? req.session.coupon.discount:0
        })
        const orderSuccess = await orderData.save() 
        console.log(orderSuccess._id);
        console.log(orderSuccess.ordered);
        req.session.orderId = orderSuccess._id
        // await coupon.findOneAndUpdate({couponCode:req.session.coupon.couponCode},
        //     {$push:{users:req.session.user_id}})

        // req.session.coupon = ''

        if(payment == 'COD'){
           
            if(orderSuccess){
                orderSuccess.ordered = true
                await orderSuccess.save()
                await coupon.findOneAndUpdate({couponCode:req.session.coupon.couponCode},
                    {$push:{users:req.session.user_id}})
        
                req.session.coupon = ''
               
                const cartProducts = userData.cart.items
                for(let i = 0; i< cartProducts.length;i++){
                    singleProduct =await product.findById(cartProducts[i].productId)
                    singleProduct.quantity -= cartProducts[i].quantity
                    singleProduct.save()
                }
                userData.cart.items.splice(0,userData.cart.items.length)
                userData.cart.totalPrice = 0 
                userData.save()
                 
            }
    
          
            res.json({success:true,cod:true})  
        }else{
            var instance = new Razorpay({
                key_id: RAZORPAY_ID,
                key_secret: RAZORPAY_SECRET,
              })
              var options = {
                amount: totalPrice,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderSuccess._id
              }
              instance.orders.create(options, function(err, order) {
                if(err){
                 
                }else{
                  
                   res.json({success:true,order})
                }
               
              })
              
        }

    } catch (error) {
        console.log(error.message)
        
    }
}

const verifyPayment = async(req,res)=>{
    try {
        
        orderId = req.body.order.receipt
        const crypto = require('crypto')
        const hmac = crypto.createHmac('sha256', RAZORPAY_SECRET)
        .update(req.body.payment.razorpay_order_id+'|'+req.body.payment.razorpay_payment_id)
        .digest('hex')
       
        if(hmac == req.body.payment.razorpay_signature){
            const update = {$set:{
                paymentStatus: 'Charged',
                ordered:true
            }}
            const options = {new: true}
            await order.findByIdAndUpdate(orderId,update,options).then(()=>{
                res.json({success:true})
            })
            //coupon
            await coupon.findOneAndUpdate({couponCode:req.session.coupon.couponCode},
                {$push:{users:req.session.user_id}})
    
            req.session.coupon = ''

            // cart and stock
            const userData  = await users.findById(req.session.user_id)
            const cartProducts = userData.cart.items
           
            for(let i = 0; i< cartProducts.length;i++){
                singleProduct =await product.findById(cartProducts[i].productId)
                singleProduct.quantity -= cartProducts[i].quantity
                singleProduct.save()
            }
            userData.cart.items.splice(0,userData.cart.items.length)
            userData.cart.totalPrice = 0 
            userData.save()
        }
       else{
        res.json({paymentFailed:true})
       } 
       
    } catch (error) {
        console.log(error.message);
    }
}

const loadOrderSuccess = async(req,res)=>{
    try {
        if(req.session.orderId){
            req.session.orderId =''
            res.render('orderSuccess')
            
        }else{
            res.redirect('/home')
        }
        
    } catch (error) {
        console.log(error.message);
    }
}


const loadEditAddress = async(req,res)=>{
    try {
            const addressId = req.query.aId
            const userData =await users.findOne({_id:req.session.user_id},{cart:1,shippingAddress:{$elemMatch:{_id:addressId}}})
            console.log(userData)
            const shippingAddress = userData.shippingAddress
            res.render('checkoutEditAddress',{userData,shippingAddress})
        
    } catch (error) {
        console.log(error.message);
    }
   
}

const editAddress = async(req,res)=>{
    try {
        const addressId = req.body.addressId
        const filter = {_id:req.session.user_id,'shippingAddress._id':addressId}
        const update= {$set:{
            'shippingAddress.$': {
                name:req.body.name,
                phoneNumber:req.body.phoneNumber,
                pinCode:req.body.pinCode,
                locality:req.body.locality,
                address:req.body.address,
                district:req.body.district,
                state:req.body.state
            }
        }}
        const options = {new :true}
        const userData = await users.updateOne(filter,update,options)
        console.log(userData)
        if(userData.modifiedCount == 1){
            res.redirect('/checkOut')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const deleteAddress = async(req,res)=>{
    try {
        const addressId = req.query.aId
        const filter = {_id:req.session.user_id}
        const update = {
            $pull:{
                shippingAddress:{_id:addressId},
            },
        }
        const options = {new:true}
        const updatedData = await users.updateOne(filter,update,options)
        if(updatedData.modifiedCount == 1){
            res.redirect('/checkOut')
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const couponApply = async(req,res)=>{
    try {
       
        const couponCode = req.query.coupon
        let message = ''
        let userData = await users.findById(req.session.user_id)
        
        await coupon.findOne({couponCode:couponCode}).then((coupon)=>{
            const couponCode = coupon.couponCode
            let totalPrice = userData.cart.totalPrice
            let discount = coupon.discount 
            const time = new Date()
            const userIndex = coupon.users.findIndex((user)=>{
                return new String(user).trim() == new String(req.session.user_id).trim()
                
            })
           
            if(userIndex == -1){
                if(coupon.expiryDate.getTime() > time.getTime()){
               
                    if(totalPrice < coupon.minimumAmount  ){
                        
                        message=`coupon cannot be applied as it requires a purchase between ${coupon.minimumAmount} and ${coupon.maximumAmount}`
                        res.json({message})
                       
                    }else{
                        if(totalPrice > coupon.maximumAmount){
                            const maximumAmount = coupon.maximumAmount
                            const message = `Coupon limit is ${maximumAmount}`
                            req.session.coupon = {couponCode,discount}
                            res.json({success:true,maximumLimit:true,message,totalPrice,discount,couponCode,maximumAmount})
                        }else{
                            req.session.coupon = {couponCode,discount}
                            res.json({success:true,totalPrice,discount,couponCode})
                        }
                        // const couponCode = coupon.couponCode
                        // res.json({success:true,totalPrice,discount,couponCode})
                    }
                    // res.json({success:true,totalPrice,discount})
                }else{
                message = 'Coupon Expired'
                res.json({message})
                }  
            
            }else{
                message = 'Coupon already applied'
                res.json({message})
            }

            
             
        }).catch(()=>{
            message = 'Coupon Not valid'
            res.json({message})
        })
    } catch (error) {
        console.log(error.message);
    }
}

const productReview = async(req,res)=>{
    try {
       
        const productReview = req.body.productReview
        const pId = req.body.pid
        const ObjectId = mongoose.Types.ObjectId;
        console.log(typeof productReview)
        console.log(typeof pId);
        console.log(typeof req.session.user_id);
        await product.findByIdAndUpdate(pId,{$push:{reviews:{userId:req.session.user_id,userReview:productReview}}}).then((data)=>{
            console.log("success");
            if(data){
                res.redirect('/home')

            }
        }).catch((err)=> console.log(err.message))
        

    } catch (error) {
        console.log(error.message)
    }
}

const updateProductReview = async(req,res)=>{
    try {
        const productReview = req.body.productReview
        const pId = req.body.pid
        const reviewId  = req.body.reviewId
        console.log('hello update review');
        await product.findOneAndUpdate({_id:pId,'reviews._id':reviewId},{$set:{'reviews.$.userReview':productReview}},{new:true}).then((data)=>{
            if(data){
                res.json({success:true,productReview})
            }else{
                console.log('error');
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadCheckOut,
    checkOut,
    loadOrderSuccess,
    orderHistory,
    loadOrderDetails,
    cancelOrder,
    returnOrder,
    loadEditAddress,
    editAddress,
    deleteAddress,
    verifyPayment,
    couponApply,
    productReview,
    updateProductReview
}