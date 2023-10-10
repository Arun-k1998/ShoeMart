const User = require('../model/userModel')
const categorie = require('../model/categoriesModel');
const product = require('../model/productModel');
const banner = require('../model/bannerModel')
const bcrypt= require('bcrypt');
const orderitem = require('../model/orderItemModel')
const order = require('../model/orderModel')
const {findOne, findByIdAndUpdate, findByIdAndDelete}= require('../model/categoriesModel')
const coupon = require('../model/couponModel')
const cloudinary = require('cloudinary').v2


// cloudinary Configuration 

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRECT
});

// html to pdf require
const ejs = require('ejs')
const pdf = require("html-pdf")
const fs = require('fs')
const path = require('path');
// const { resolve } = require('path');


const loadLogin = async(req,res)=>{
    try {
        res.render('login');
        
    } catch (error) {
        console.log(error.message);
    }
}
const verifyLogin = async(req,res)=>{
    try {
        const email = req.body.email ;
        const userData =  await User.findOne({email: email})
        const password = req.body.password
       
        if(userData){
            const verifyPassword = await bcrypt.compare(password,userData.password)
            if(verifyPassword){
                if(userData.is_admin === 0){
                    res.render('login',{message : 'Incorrect username or password'})
                }else{
                    req.session.adminid = userData._id;
                    console.log(req.session.adminid)
                    res.redirect('/admin/home');
                }
            }else{
                res.render('login',{message : 'incorrect username or password'})
            }
        }else{
            res.render('login',{message : 'incorrect username or password'})
        }
        
    } catch (error) {
        console.log(error.message)
    }
}
const homePage = async(req,res)=>{
    try {

             const userData = await User.findOne({_id: req.session.adminid})
             const totalUser = await User.find({is_admin:0,isBlocked:false}).countDocuments()
             const orderData = await order.find({}).sort({createdDate:-1}).populate('user','firstName')
             const totalOrder =await order.find({orderStatus:"Placed"}).countDocuments()
             console.log("orderDataaaa");
             console.log(orderData);
             const pipeLine = [
                {
                    $match:{orderStatus:'Placed',
                    ordered:true
                }
                },
                {
                    $group:{
                        _id:null,
                        totaOrder:{$sum:1},
                        totaSales:{$sum:'$totalPrice'}
                    }
                }
             ]
             const orderDetails = await order.aggregate(pipeLine)
            

            // category wise sales
            const categoryWise = await order.aggregate([
                {
                     $match:{orderStatus:"Placed",
                     ordered:true}
                },
                {
                    $unwind:"$product"
                },
                {
                    $lookup:{
                        from:"products",
                        localField:"product.productId",
                        foreignField:"_id",
                        as:"product"
                    }
                },
                {
                    $unwind:"$product"
                },
                {
                    $group:{
                        _id:"$product.category",
                       totalSale:{$sum:"$product.price"}
                    }
                }
               
            ])
        //    console.log(categoryWise);
            const paymentMethod =await order.aggregate([
                {
                    $match:{orderStatus:"Placed",
                    ordered:true
                            }
                },
                {
                    $group:{
                        _id:"$paymentMethod",
                        count:{$sum:1}
                    }
                },
                {
                    $project:{
                        _id:0,
                        paymentMethod:"$_id",
                        percentage:{
                            $multiply:[
                                {$divide:["$count",totalOrder]},100
                            ]
                        }
                    }
                },
                {
                    $sort:{
                        paymentMethod:1
                    }
                }
            ])
           
            const weeklySales = await order.aggregate([
                {$match:{
                    createdDate:{
                        $gte: new Date(new Date().getTime() - (7*24*60*60*1000))
                    },
                    orderStatus:"Placed",
                    ordered:true
                }
                
            },
            {
                $group:{
                    _id:{
                        $dayOfWeek:'$createdDate'
                    },
                    totalAmount:{
                        $sum:
                            "$totalPrice"  
                    }
                }
            },{
                $sort:{
                    _id:1
                }
            }

            ])  
            // console.log(new Date());
            // console.log(new Date(new Date().getTime() - (7*24*60*60*1000)));
            // console.log(weeklySales);
            const circular = categoryWise.map((category)=> category.totalSale)
            const donutChart = paymentMethod.map((payment)=> payment.percentage)
            const barChart = weeklySales.map((payment)=> payment.totalAmount) 
            res.render('home',{admin: userData,orderDetails,totalUser,orderData,circular,donutChart,barChart})
       
        
    } catch (error) {
        console.log(error.message)
    }
}


//-----------User Management----------------------- 

const userManagement = async(req,res)=>{
    try {
        
        var search = '';
        if(req.query.search){
            search = req.query.search;
        }

        const userData = await User.find({is_admin: 0,$or:[
            {firstName:{$regex:'.*'+search+'.*',$options:'i'}},
            {phoneNumber:{$regex:'.*'+search+'.*',$options:'i'}},
            {emali:{$regex:'.*'+search+'.*',$options:'i'}}
        ]})
        res.render('UserManagement',{users:userData})

    } catch (error) {
        console.log(error.message)
    }
} 

const blockUser = async(req,res)=>{
    try {
        
        const id = req.query.id;
        console.log(id)
        const userData = await User.findOneAndUpdate({_id:id},{$set:{isBlocked:true}})
        req.session.user_id = false
        res.redirect('/admin/user')
    } catch (error) {
        console.log(error.message)
    }
}

const UnblockUser = async(req,res)=>{
    try {
        const id = req.query.id;
        console.log(id)
        const userData = await User.findOneAndUpdate({_id:id},{$set:{isBlocked:false}})
        res.redirect('/admin/user')
    } catch (error) {
        console.log(error.message)
    }
}

const deleteUser = async(req,res)=>{
    try {
        const id = req.query.id;
        await User.deleteOne({_id: id});
        res.redirect('/admin/user')
    } catch (error) {
        console.log(error.message)
    }
}

//-----------Catogie Management----------------------- 
const loadCategorie = async(req,res)=>{
    try {
        const categories =await categorie.find({is_delete:false})
        console.log(categories);
        res.render('category',{categories : categories})
    } catch (error) {
        console.log(error.message)
    }
}

const loadAddCategorie = async(req,res)=>{
    try {
       
        res.render('categorieManagement')
    } catch (error) {
        console.log(error.message)
    }
}


const addCategorie = async(req,res)=>{
    try {
        const title = req.body.title;
        const description = req.body.description
        const oldCategorie = await categorie.findOne({Title :{$regex:title,$options:'i'}});
        if(oldCategorie){
            res.render('categorieManagement',{message: 'Already exists this category'})
        }else{
            const newcategorie = new categorie({
                Title : title,
                Description : description,
                image: req.file.filename
            });
            const categorieData = await newcategorie.save()
            if(categorieData){
                res.render('categorieManagement',{message : 'Successfully added new categorie'})
            }else{
                res.render('categorieManagement',{message : 'something went wrong.Try again'})
            }
        }  
    } catch (error) {
        console.log(error.message)
    }
}

const deleteCategory = async(req,res)=>{
    try {
        const id = req.query.id;
        // await categorie.deleteOne({_id: id});
        await categorie.findByIdAndUpdate({_id:id},{$set:{is_delete:true}})
        res.redirect('/admin/categories');
    } catch (error) {
        console.log(error.message)
    }
}

const loadUpdateCategory = async(req,res)=>{
    try {
        
        const id = req.query.id ;
        const categoryData = await categorie.findOne({_id: id});
        // console.log(categoryData);
        res.render('updateCategory',{categoryData});
        // const category = findByIdAndUpdate({_id : id})
    } catch (error) {
        console.log(error.message)
    }
}

const updateCategory = async(req,res)=>{
    try {
        const id = req.body.id;
        console.log(id);
        // console.log(await categorie.find({}));
         const updatedCategory = await categorie.findOneAndUpdate({Title:req.body.oldtitle},{$set:{Title:req.body.title,
            Description:req.body.description,
            image:req.file.filename
        }})
        // console.log(updatedCategory);
       
        if(updatedCategory){
            res.redirect('/admin/categories')
        }
        else{
            res.render('updateCategory',{message: 'something wrong ', categorie : category})
        }
    } catch (error) {
        console.log(error.message)
    }
}

// ----------------Product Management----------------------

const loadProduct = async(req,res)=>{
    try {
       
             
             const products = await product.find({is_delete:false}).populate('category')
            //  console.log(products)
            

            res.render('ProductManagement',{product:products})
       
    } catch (error) {
        console.log(error.message)
    }
}

const loadAddProduct = async(req,res)=>{
    try {
       
            const categoriesData = await categorie.find({is_delete:false});
            const allowedSizes = await product.schema.path('sizes').enumValues;
            
            console.log(allowedSizes)
            res.render('addProduct',{category:categoriesData,allowedSizes:allowedSizes})  
       
    } catch (error) {
        console.log(error.message)
    }
}

const uploads = async(file,folder)=>{
   
        const result = await cloudinary.uploader.upload(file,{
            resource_type:"auto",
            folder:"Images"
        })
        console.log(result);
       return result.secure_url
    
}
const addProduct = async(req,res)=>{
    try {
        const sizes = req.body.size;
        console.log(sizes) 
        console.log(req.body.category)
        
     
        const uploader = async(path)=> await uploads(path,"Images")
        let url = []
        const files = req.files
        for(let file of files){
            const path= file.path
         
            const newPath = await uploader(path)
            console.log(newPath);
                
            url.push(newPath)
            fs.unlinkSync(path)
        }
        console.log("url"+url);
        const productData = new product({
            name :req.body.name,
            description:req.body.description,
            price:req.body.price,
            image:url,
            category:req.body.category,
            sizes: sizes,
            quantity: req.body.quantity,
            gender:req.body.gender
        })
        const data = await productData.save();
        console.log(data)
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message)
    }
}

const loadupdateProduct = async(req,res)=>{
    try {
           
               
                const productData = await product.findOne({_id:req.query.id});
                
                const allowedSizes = await product.schema.path('sizes').enumValues
                const category = await categorie.find({})
                res.render('updateProduct',{product:productData,allowedSizes:allowedSizes,category:category})
            
          

    } catch (error) {
        console.log(error.message)
    }
}

const updateProduct = async(req,res)=>{
    try {
      
         const allowedSizes = await product.schema.path('sizes').enumValues
        //  const category = await categorie.find({})
        //  const image = req.files.map((file)=> file.filename)
        const uploader = async(path)=> await uploads(path,"Images")
        let url = []
        const files = req.files
        for(let file of files){
            const path= file.path
           
            const newPath = await uploader(path)
            console.log(newPath);
                
            url.push(newPath)
            fs.unlinkSync(path)
        }
        
        for(let i= 0;i < url.length;i++){
            const singleImage = url[i]
            await product.findByIdAndUpdate({_id:req.body.id},{$push:{image:singleImage}})
        }
        
       const productData= await product.findOneAndUpdate({_id:req.body.id},{$set:{
            name: req.body.name,
            description:req.body.description,
            price:req.body.price,
            // image:image,
            sizes:req.body.size,
            category:req.body.category,
            quantity:req.body.quantity
        }})
        if(productData){
            const category = await categorie.find({is_delete:false})
            res.render('updateProduct',{message:'successfully updated',product:productData,allowedSizes:allowedSizes,category:category})
        }else{
            res.render('updateProduct',{message:'something went wrong'});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const deleteImage = async(req,res)=>{
    try {
        const image = req.query.id
        const pId = req.query.pId
        // const imagePath = path.join(__dirname,'..','public','images','adminImages',image)
        // fs.unlink(imagePath,(err)=>{
        //     if(err){
        //         console.log(err.message);
        //         throw err
        //     }else{
        //         console.log(`${image} deleted!`);
        //     }
        // })
        await product.findByIdAndUpdate(pId,{$pull:{image:image}},{new:true}).then((data)=>{
            if(data){
              res.redirect(`/admin/products/updateProduct?id=${data._id}`)
            }else{
                res.json({message:'error'})
            }
        })
        
    } catch (error) {
        console.log(error.message);
    }
}

const deleteProduct = async(req,res,)=>{
     try {
        const id= req.query.id 
        await product.findOneAndUpdate({_id:id},{$set:{is_delete:true}})
        res.redirect('/admin/products')
     } catch (error) {
        console.log(error.message)
     }
}

//--------------Banner Management-------------------------

const loadBannerManagement = async(req,res)=>{
    try {
        
            const bannerData = await banner.find({is_delete:false})
            
            res.render('bannerManagement',{banner:bannerData})
       
    } catch (error) {
        console.log(error.message);
    }
}

const loadaddBanner = async(req,res)=>{
    try {
       

            res.render('addBanner')
       
    } catch (error) {
        console.log(error.message)
    }
}

const addBanner = async(req,res)=>{
    try {
        const images = req.files.map((file)=> file.filename)
        const bannerData = new banner({
          title : req.body.name,
          image : images,
          url : req.body.url ,
          description: req.body.description 
        })
        if(bannerData){
            await bannerData.save()
            res.redirect('/admin/banners')
        }else{
            res.redirect('/admin/add_banner')
        }
        
        
    } catch (error) {
        console.log(error.message)
    }
}

const loadupdateBanner = async(req,res)=>{
    try {
        const id = req.query.id;
        const bannerData = await banner.findById({_id:id})
        res.render('updateBanner',{banner:bannerData})
        
    } catch (error) {
        console.log(error.message);
    }
}

const updateBanner = async(req,res)=>{
    try {
        const id = req.body.id
        console.log(req.files);
        const images = req.files.map(file=>file.filename)
        for(let i = 0;i< images.length;i++){
            let singleImage = images[i]
            await banner.findByIdAndUpdate({_id:id},{$push:{image:singleImage}})
        }
        const bannerData = await banner.findByIdAndUpdate({_id:id},{$set:{
            title: req.body.name,  
            // image : images,
            url : req.body.url ,
            description: req.body.description 
        }});
        const updatedBanner = await bannerData.save();
        if(updatedBanner){
            res.redirect('/admin/banners')
        }else{
            res.redirect('/admin/home')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const deleteBanner = async(req,res)=>{
    try {
        const id = req.query.id;
         await banner.findByIdAndUpdate({_id:id},{$set:{is_delete:true}})
        res.redirect('/admin/banners')
    } catch (error) {
        console.log(error.message);
    }
}

const deleteBannerImage = async(req,res)=>{
    try {
        const image = req.query.id
        const bId = req.query.bId
        const imagePath = path.join(__dirname,'..','public','images','adminImages',image)
        fs.unlink(imagePath,(err)=>{
            if(err){
                console.log(err.message);
                throw err
            }else{
                console.log(`${image} deleted!`);
            }
        })
        await banner.findByIdAndUpdate(bId,{$pull:{image:image}},{new:true}).then((data)=>{
            if(data){
              res.redirect(`/admin/banners/update_banner?id=${data._id}`)
            }else{
                res.json({message:'error'})
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}
// --------- order Management--------------
const loadOrderManagement = async(req,res)=>{
    try {
        
           
             const orders = await order.find({}).populate('user','firstName').sort({createdDate:-1})
             const orderStatus = order.schema.path('orderStatus').enumValues
             const time = orders.map((order)=>{
                const date = new Date(order.createdDate)
                return date.createdDate();
             })
           console.log(orders);
            res.render('orderManagement',{orders :orders,time,orderStatus})
        
    } catch (error) {
        console.log(error.message);
    }
}

const viewOrderDetails = async(req,res)=>{
    try {
        
            const id = req.query.id
            const orders = await order.findById({_id:id}).populate('user').populate({path:'product',populate:'productId'})
            const orderStatus = order.schema.path('orderStatus').enumValues
            const paymentStatus = order.schema.path('paymentStatus').enumValues
            
            res.render('orderDetails',{orders,user:orders.user,produt:orders.product,address:orders.user.shippingAddress,orderStatus,paymentStatus})
       
    } catch (error) {
        console.log(error.message);
    }
}

const orderStatusChange = async(req,res)=>{
    try {
        const orderStatus = req.body.orderStatus
        const paymetnStatus = req.body.paymentStatus
        const updatedOrder = await order.findByIdAndUpdate({_id:req.body.id},{$set:{
            orderStatus:orderStatus,
            paymentStatus:paymetnStatus
        }})
        
        if(updatedOrder){
            console.log(updatedOrder);
            res.redirect('/admin/orders')
        }
      
        
    } catch (error) {
         console.log(error.message); 
    }
}

// coupon management

const loadCouponManagement = (req,res)=>{
    return new Promise((resolve,reject)=>{
        const couponData = coupon.find({is_delete:false})
        Promise.all([couponData]).then(([couponData])=>{
            const time = couponData.map((coupon)=>{
                const date = new Date(coupon.expiryDate)
                return date.toLocaleString();
             })
            res.render('coupenManagement',{couponData,time})
        })
        
    })
}

const loadAddCoupon = async(req,res)=>{
    try {
        
       
        res.render('addCoupon')
    } catch (error) {
        console.log(error.message)
    }
}

const addNewCoupon = async(req,res)=>{
    try {
        const couponCode = req.body.couponCode
        const discount = req.body.percentage
        const minimumAmount = req.body.minimumAmount
        const maximumAmount = req.body.maximumAmount
        const expiryDate = req.body.expiryDate
        const Coupon = new coupon({
            couponCode:couponCode,
            discount:discount,
            minimumAmount:minimumAmount,
            maximumAmount:maximumAmount,
            expiryDate:expiryDate
        })
        const couponData = Coupon.save()
        if(couponData){
            res.render('addCoupon',{message:'Coupon added successfully'})
        }else{
            res.render('addCoupon',{message:'something Wrong'})
        }


    } catch (error) {
        console.log(error.messsage);
    }
}
const loadupdateCoupon = async(req,res)=>{
    try {
        const couponId = req.query.id
        await coupon.findById(couponId).then((couponData)=>{
            res.render('updateCoupon',{couponData})
        })

    } catch (error) {
        console.log(error.message);
    }
}
const updateCoupon = async(req,res)=>{
    try {
        const couponId = req.body.id
        const update = {
            couponCode:req.body.couponCode,
            discount:req.body.discount,
            minimumAmount:req.body.minimumAmount,
            maximumAmount:req.body.maximumAmount,
            expiryDate:request.body.expiryDate,   
        }
        await coupon.findByIdAndUpdate(couoponId,{$set:update}).then((data)=>{
            if(data){
                res.redirect('')
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

const deleteCoupon = async(req,res)=>{
    try {
        const cId = req.query.id
        await coupon.findByIdAndDelete(cId)
        res.redirect('/admin/CouponManagement')
    } catch (error) {
        console.log(error.message);
    }
}


// -------------- Sales Report -----------------------------


const loadSalesReport = async(req,res)=>{
    try {
       
        const totalSales = await order.aggregate([
            {
              $match: { orderStatus: "Placed" }
            },
            {
              $unwind: "$product"
            },
            {
              $lookup: {
                from: "products",
                localField: "product.productId",
                foreignField: "_id",
                as: "product"
              }
            },
            {
              $unwind: "$product"
            },
            {
              $group: {
                _id: "$product.category",
                totalSale: { $sum: "$product.price" }
              }
            },
            {
              $group: {
                _id: null,
                categorySales: {
                  $push: {
                    category: "$_id",
                    totalSale: "$totalSale"
                  }
                },
                totalSales: { $sum: "$totalSale" }
              }
            },
            {
              $lookup: {
                from: "categories",
                localField: "categorySales.category",
                foreignField: "_id",
                as: "category"
              }
            },
            {
              $project: {
                _id: 0,
                categorySales: {
                  $map: {
                    input: "$categorySales",
                    as: "sale",
                    in: {
                      category: {
                        $arrayElemAt: ["$category.Title", {
                          $indexOfArray: ["$category._id", "$$sale.category"]
                        }]
                      },
                      percentage: { $multiply: [{ $divide: ["$$sale.totalSale", "$totalSales"] }, 100] }
                    }
                  }
                }
              }
            }
          ])
          
          
        console.log(totalSales[0])
        const totalSale = totalSales[0]
        
        
        let from;
        let to;
        if(req.query.from && req.query.to){
            from = req.query.from
            to = req.query.to
       
        
        }else{
            to = new Date()
            let fromDate = new Date(to.getTime()-(7*24*60*60*1000))
            from = fromDate
            
        }
       
        const orderData = await order.find({createdDate:{$gte: from,$lte:to}, ordered:true}).sort({createdDate:-1}).populate('user').populate("product.productId","name")
       
        res.render('salesReport',{totalSale,orderData,from,to})
    } catch (error) {
        console.log(error.message);
    }
}

const salesReportDownload = async(req,res)=>{

    try {
        let from;
        let to;
        if(req.body.from && req.body.to){
            console.log('hesr');
            from = req.body.from
            to = req.body.to
        }else{ 
            to = new Date()
            let fromDate = new Date(to.getTime()-(7*24*60*60*1000))
            from = fromDate
        }
        const orderData = await order.find({createdDate:{$gte:from,$lte:to}, ordered:true}).sort({createdDate:-1}).populate('user').populate("product.productId","name")
        const data= {
            orderData:orderData,
            from,to
        }
        const filePathName = path.resolve(__dirname,'../views/admin/htmlToPdf.ejs')
        const htmlString = fs.readFileSync(filePathName).toString()
        const ejsData = ejs.render(htmlString,data)
        const option = {
            format:"letter",
        }
        pdf.create(ejsData,option).toFile('./public/reports/saleReport.pdf',(err,response)=>{
            if(err)console.log(err.message);

            console.log("file created");
            res.json({});
        })

    } catch (error) {
        console.log(error.message);
    }
}

const logout = async(req,res)=>{
    try {
        req.session.adminid = "";
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    loadLogin,
    verifyLogin,
    homePage,
    userManagement,
    blockUser,
    UnblockUser,
    deleteUser,
    loadCategorie,
    loadAddCategorie,
    addCategorie,
    deleteCategory,
    loadUpdateCategory,
    updateCategory,
    logout,
    loadProduct,
    loadAddProduct,
    addProduct,
    loadupdateProduct,
    updateProduct,
    deleteProduct,
    loadBannerManagement,
    loadaddBanner,
    addBanner,
    loadupdateBanner,
    updateBanner,
    deleteBanner,
    deleteBannerImage,
    loadOrderManagement,
    viewOrderDetails,
    orderStatusChange,
    loadCouponManagement,
    loadAddCoupon,
    addNewCoupon,
    deleteImage,
    loadupdateCoupon,
    deleteCoupon,
    loadSalesReport,
    salesReportDownload
}