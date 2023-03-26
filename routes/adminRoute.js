const express = require('express');
const admin_Route = express();
const session = require('express-session');
var mime = require('mime-types')


admin_Route.use(session({
    secret: 'hello '
}));

admin_Route.set("view engine","ejs");
admin_Route.set("views","./views/admin");


const bodyparser = require('body-parser');
admin_Route.use(bodyparser.json());
admin_Route.use(bodyparser.urlencoded({extended: true}));
//--------multer--------------
const multer = require('multer')
const path = require('path')


const storage =multer.diskStorage({
  destination : function(req,file,cb){
    cb(null,path.join(__dirname,'../public/images/adminImages'))
  },
  filename  : function(req,file,cb){
    const name = Date.now()+'-'+file.originalname;
    cb(null,name);    
  }

});

const fileFilter = (req,file,cb)=>{
  if(file.mimetype ==='image/png' || file.mimetype ==='image/jpg' || file.mimetype ==='image/jpeg' || file.mimetype === 'image/webp'||file.mimetype === 'image/gif'){
      cb(null,true)
  }else{
   
      cb(null,false)
  }
 
}

const upload=multer({storage:storage,fileFilter:fileFilter})

// const upload = multer({storage:storage});


const adminController = require('../controller/adminController')
const adminAuth = require('../middelware/adminAuth')

admin_Route.get('/',adminAuth.logOut,adminController.loadLogin)
admin_Route.post('/',adminController.verifyLogin);
admin_Route.get('/home',adminAuth.logIn,adminController.homePage)

//user Management
admin_Route.get('/user',adminAuth.logIn,adminController.userManagement);
admin_Route.get('/blockUser',adminController.blockUser);
admin_Route.get('/UnblockUser',adminController.UnblockUser);
admin_Route.get('/deleteUser',adminController.deleteUser)

//Categorie Management

admin_Route.get('/Categories',upload.single('image'),adminAuth.logIn,adminController.loadCategorie);
admin_Route.get('/add_Category',adminAuth.logIn,adminController.loadAddCategorie);
admin_Route.post('/add_Category',upload.single('image'),adminController.addCategorie);
admin_Route.get('/deleteCategory',adminAuth.logIn,adminController.deleteCategory);
admin_Route.get('/updateCategory',adminAuth.logIn,adminController.loadUpdateCategory);
admin_Route.post('/updateCategory',upload.single('image'),adminAuth.logIn,adminController.updateCategory);

// product Management--

admin_Route.get('/products',adminAuth.logIn,upload.array('image',10),adminController.loadProduct)
admin_Route.get('/products/addProduct',adminAuth.logIn,adminController.loadAddProduct)
admin_Route.post('/products/addProduct',upload.array('image',10),adminController.addProduct)
admin_Route.get('/products/updateProduct',adminAuth.logIn,adminController.loadupdateProduct)
admin_Route.post('/products/updateProduct',upload.array('image',10),adminController.updateProduct)
admin_Route.get('/products/deleteProduct',adminAuth.logIn,adminController.deleteProduct)
admin_Route.get('/delete-product-image',adminController.deleteImage)


//  Banner management
admin_Route.get('/banners',adminAuth.logIn,upload.array('image',10),adminController.loadBannerManagement)
admin_Route.get('/banner/add_banner',adminAuth.logIn,upload.array('image',10),adminController.loadaddBanner)
admin_Route.post('/banner/add_banner',upload.array('image',10),adminController.addBanner)
admin_Route.get('/banners/update_banner',adminAuth.logIn,upload.array('image',10),adminController.loadupdateBanner)
admin_Route.post('/banners/update_banner',upload.array('image',10),adminController.updateBanner)
admin_Route.get('/banners/delete_banner',adminAuth.logIn,adminController.deleteBanner)
admin_Route.get('/delete-banner-image',adminController.deleteBannerImage)
// ordrer Manangement
admin_Route.get('/orders',adminAuth.logIn,adminController.loadOrderManagement)
admin_Route.get('/orders/order_details',adminAuth.logIn,adminController.viewOrderDetails)
admin_Route.post('/orders/order_details',adminController.orderStatusChange)

//coupon Management
admin_Route.get('/CouponManagement',adminController.loadCouponManagement)
admin_Route.get('/Coupon/add_coupon',adminController.loadAddCoupon)
admin_Route.post('/Coupon/add_coupon',adminController.addNewCoupon)
admin_Route.get('/coupon/updateCoupon',adminController.loadupdateCoupon)
admin_Route.get('/coupon/deleteCoupon',adminController.deleteCoupon)

// ------------ sales report ----------
admin_Route.get('/sales-Report',adminAuth.logIn,adminController.loadSalesReport)
admin_Route.post('/download-salesReport',adminController.salesReportDownload)
admin_Route.get('/date-by-order',adminAuth.logIn,adminController.loadSalesReport)
admin_Route.get('/logout',adminAuth.logIn,adminController.logout)

module.exports = admin_Route;