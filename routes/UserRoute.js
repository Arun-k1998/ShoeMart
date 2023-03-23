const express = require('express');
const user_Route = express();
const session = require('express-session')

user_Route.use(session({
    secret: 'hello '
}));

user_Route.set("view engine","ejs");
user_Route.set("views","./views/user");



const bodyparser = require('body-parser');
user_Route.use(bodyparser.json());
user_Route.use(bodyparser.urlencoded({extended: true}));


const userController = require('../controller/userController')
const userAuth = require('../middelware/userAuth')
const orderController = require('../controller/orderController')
const { loadCheckOut } = require('../controller/orderController')

// user_Route.get('/',userAuth.LogOut,userController.home);

user_Route.get('/',userController.direct)
user_Route.get('/home',userController.home)


//Login page
user_Route.get('/login',userAuth.LogOut,userController.userLogin);
user_Route.post('/login',userController.verifyLogin);

//registeration
user_Route.get('/registeration',userAuth.LogOut,userController.LoadRegisteration);
user_Route.post('/registeration',userController.inserUser);



//otp verification
user_Route.post('/verifyOTP',userController.verifyOtp);
user_Route.get('/resendOtp',userAuth.LogOut,userController.resendOtp)

//forget password
user_Route.get('/forgetPassword',userAuth.LogOut,userController.forgetPassword)
user_Route.post('/forgetPassword',userController.FPsendOTP)
user_Route.post("/FPverifyOTP",userController.fpVerifyOtp)
user_Route.get('/newPassword',userAuth.LogOut,userController.loadnewPassword)
user_Route.post('/newPassword',userController.newPassword)

// product listing
user_Route.get('/home/products',userController.loadProducts)
user_Route.get('/home/prodcut/product_details',userController.loadDetailsViewProduct)
user_Route.post('/product-review', orderController.productReview)
user_Route.post('/update-product-review',orderController.updateProductReview)


//cart 
user_Route.get('/home/cart',userAuth.LogIn,userController.loadCart)
user_Route.post('/home/addToCart',userController.addToCart)
user_Route.post('/home/updateCart',userController.updateCart)
user_Route.get('/home/deleteCartItem',userAuth.LogIn,userAuth.LogIn,userController.deleteCartItem)


//wishList

user_Route.get('/home/wish-list',userAuth.LogIn,userController.loadWishList)
user_Route.post('/add-to-whishlist',userAuth.LogIn,userController.addToWishlist)
user_Route.post('/home/wishList_to_addToCart',userAuth.LogIn,userController.wishListToCart)
user_Route.get('/deleteWishListItem',userAuth.LogIn,userController.deleteFromWishList)

//profile
user_Route.get('/profile',userAuth.LogIn,userController.loadProfile)
user_Route.post('/edit-profile',userController.updateProfile)
user_Route.post('/add-address',userController.addAddress)
user_Route.get('/update-address',userAuth.LogIn,userController.updateAddress)
user_Route.get('/order-history',userAuth.LogIn,orderController.orderHistory)
user_Route.put('/cancel-order',orderController.cancelOrder)
user_Route.put('/return-order',orderController.returnOrder)


//Payment
user_Route.get('/checkOut',userAuth.LogIn,orderController.loadCheckOut)
user_Route.post('/procced-to-payment',orderController.checkOut)
user_Route.get('/order-success',orderController.loadOrderSuccess)
user_Route.get('/order-Details',userAuth.LogIn,orderController.loadOrderDetails)
user_Route.get('/editAddress',userAuth.LogIn,orderController.loadEditAddress)
user_Route.post('/editAddress',orderController.editAddress)
user_Route.get('/checkoutDeleteAddress',userAuth.LogIn,orderController.deleteAddress)
user_Route.post('/verify-payment',orderController.verifyPayment)

//  coupon
user_Route.get('/applyCoupon',userAuth.LogIn,orderController.couponApply)


user_Route.get('/logout',userAuth.LogIn,userController.logout)

// user_Route.get('*',userController.error404)

module.exports = user_Route;