const users = require("../model/userModel");
const bcrypt = require("bcrypt");
const product = require("../model/productModel");
const category = require("../model/categoriesModel");
const banner = require("../model/bannerModel");
const order = require("../model/orderModel");
const { Reject } = require("twilio/lib/twiml/VoiceResponse");
const { find } = require("../model/userModel");
const ObjectId = require("mongodb").ObjectID;
const validator = require("validator");
const nodeMailer = require("nodemailer");

const otpGenerator = () => {
  const otp = Math.floor(Math.random() * 1000000);
  return otp;
};

const EmailOtp = {};

const noedeMailerconnect = (email) => {
  const otp = otpGenerator();
  console.log(otp);
  EmailOtp[email] = otp;

  const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,

    service: "gmail",
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: false,

    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });
  var mailOptions = {
    from: process.env.USER_EMAIL,
    to: email,
    subject: "Otp for registration is: ",
    html: `<h3>OTP for account verification  </h3>" '<hr />'
        <h1 style='font-weight:bold;'> OTP from MEDWEB is ${otp}</h1>`, // html body
  };

  const sendMail = { transporter, mailOptions };

  return sendMail;
};

const hashData = async (data) => {
  const hasedData = await bcrypt.hash(data, 10);
  return hasedData;
};

const direct = async (req, res) => {
  try {
    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
};

const home = async (req, res) => {
  try {
    if (req.session.user_id) {
      const userData = await users.findById({ _id: req.session.user_id });
      const maleShoeCollection = await product.find({ gender: "male" });
      const bannerData = await banner.find({ is_delete: false });
      const categoryData = await category.find({ is_delete: false });

      res.render("userhome", {
        userData,
        bannerData,
        maleShoeCollection,
        categoryData,
      });
    } else {
      const bannerData = await banner.find({ is_delete: false });
      const categoryData = await category.find({ is_delete: false });

      res.render("userhome", { categoryData, bannerData });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const userLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await users.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.isBlocked) {
          res.render("login", { message: "You are blocked" });
        } else {
          req.session.user_id = userData._id;

          res.redirect("/");
        }
      } else {
        res.render("login", { message: "incorrect email and password" });
      }
    } else {
      res.render("login", { message: "incorrect email and password" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//user registeration

const LoadRegisteration = async (req, res) => {
  try {
    res.render("registeration");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const checkEmail = await users.findOne({ email: req.body.email });
    const checkphoneNum = await users.findOne({ phoneNumber: req.body.phone });
    if (checkEmail) {
      res.render("registeration", { message: "Emai already exit" });
    } else if (checkphoneNum) {
      res.render("registeration", { message: "phone Number already exit" });
    } else {
      req.session.userData = req.body;
      console.log(req.session.userData);

      //------------------
      const sendMail = noedeMailerconnect(req.body.email);

      sendMail.transporter.sendMail(sendMail.mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.json({
            status: false,
            message: "otp creation fail",
          });
        } else {
          req.session.before = Date.now();
          res.render("otp");
        }
      });
      //--------------------
    }
  } catch (error) {
    console.log(error.message);
  }
};

//otp verificaton

const verifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const { email } = req.session.userData;

    if (otp == EmailOtp[email]) {
      const spassword = await hashData(req.session.userData.password);
      const user = new users({
        firstName: req.session.userData.firstName,
        lastName: req.session.userData.lastName,
        email: req.session.userData.email,
        phoneNumber: req.session.userData.phone,
        password: spassword,
        lastSent: Date.now(),
      });
      await user.save();
      delete EmailOtp[email];
      res.redirect("/login");
    } else {
      res.render("otp", { message: "otp incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//resesnd OTP

const resendOtp = async (req, res) => {
  try {
    const now = new Date().getTime();
    let currentdifference = now - req.session.before;
    const timeLimit = 10000;

    const inSeconds = timeLimit / 1000;
    if (currentdifference >= timeLimit) {
      const phone = req.session.userData.phone;
      const country_code = req.session.userData.country_code;
      const email = req.session.userData.email;
      console.log(req.session.userData);

      //-------------------
      const sendMail = noedeMailerconnect(email);

      sendMail.transporter.sendMail(sendMail.mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.json({
            status: false,
            message: "otp creation fail",
          });
        } else {
          req.session.before = Date.now();
          res.render("otp");
        }
      });
      //---------------
    } else {
      res.render("otp", {
        message: `otp regenerate only after ${inSeconds} seconds`,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//forgot password

const forgetPassword = async (req, res) => {
  try {
    res.render("forgetpassword");
  } catch (error) {
    console.log(error.message);
  }
};

const FPsendOTP = async (req, res) => {
  try {
    req.session.userData = req.body;
    const email = req.body.email;
    const userData = await users.findOne({ email: email });
    if (userData) {
      //--------------------------------
      const sendMail = noedeMailerconnect(email);

      sendMail.transporter.sendMail(sendMail.mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.json({
            status: false,
            message: "otp creation fail",
          });
        } else {
          req.session.before = Date.now();
          res.render("FPotp");
        }
      });
      //--------------------------------
    } else {
      res.render("forgetpassword", {
        message: "enter the verified Email address",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const fpVerifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const email = req.session.userData.email;
    console.log(email);
    console.log(otp);
    console.log(EmailOtp);

    if (otp == EmailOtp[email]) {
      res.redirect("/newpassword");
    } else {
      res.render("FPotp", { message: "incorrect otp" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadnewPassword = async (req, res) => {
  try {
    res.render("newPassword");
  } catch (error) {
    console.log(error.message);
  }
};

const newPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const email = req.session.userData.email;
    const spassword = await hashData(password);
    const newPassword = await users.findOneAndUpdate(
      { email: email },
      { $set: { password: spassword } }
    );
    if (newPassword) {
      res.redirect("/login");
    } else {
      res.render("newPassword");
    }
  } catch (error) {
    console.log(error.message);
  }
};
// ------------------ products ----------------------

const loadProducts = async (req, res) => {
  try {
    let search = req.query.search || "";
    let sort = req.query.sort || "";
    let pid = req.query.pid || ""; //product id
    let cid = req.query.cid || ""; //category id
    //   let skip = parseInt(req.query.skip) || 0

    let page = req.query.page || 1;
    let isRender = req.query.isRender || true;

    //limit setting
    const limit = 4;

    let userData = null;

    const query = {
      is_delete: false,
    };

    let sortQuery = { price: 1 };

    if (search)
      query["$or"] = [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
      ];

    if (sort && sort === "high-to-low") sortQuery = { price: -1 };
    //   if (cid) query["category"] = cid;
    if (cid) query["category"] = { $in: cid };
    const categoryData = await category.find({ is_delete: false });
    const allSizes = await product.schema.path("sizes").enumValues;

    if (req.session.user_id) {
      userData = await users.find({ _id: req.session.user_id });
    }
    //   const totalProductData = await product.find(query)
    const productData = await product
      .find(query)
      .sort(sortQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const count = await product.find(query).countDocuments();
    const totalPages = Math.ceil(count / limit);

    //.limit(2).skip(skip).exec();
    if (isRender == true) {
      res.render("productListing", {
        productData,
        categoryData,
        userData: userData ? userData : undefined,
        allSizes,
        pid,
        cid,
        totalPages,
        currentPage: page,
      });
    } else {
      res.json({
        success: true,
        productData,
        categoryData,
        userData: userData ? userData : undefined,
        allSizes,
        pid,
        cid,
        totalPages,
        currentPage: page,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json(error);
  }
};

const loadDetailsViewProduct = async (req, res) => {
  if (req.session.user_id) {
    const userData = await users.find({ _id: req.session.user_id });
    const productData = await product
      .findById({ _id: req.query.id })
      .populate("reviews.userId");
    const categoryData = await category.find({ is_delete: false });
    const allSizes = await product.schema.path("sizes").enumValues;
    const orderData = await order.find({
      user: req.session.user_id,
      "product.productId": req.query.id,
    });
    const orderLength = orderData.length;
    const reviewExit = productData.reviews.findIndex((review) => {
      return (
        new String(review.userId).trim() ==
        new String(req.session.user_id).trim()
      );
    });

    res.render("productDetails", {
      userData,
      productData,
      categoryData,
      allSizes,
      orderLength,
      reviewExit,
    });
  } else {
    const productData = await product.findById({ _id: req.query.id });
    const categoryData = await category.find({ is_delete: false });
    const allSizes = await product.schema.path("sizes").enumValues;
    res.render("productDetails", { productData, categoryData, allSizes });
  }
};

// ------------------------------- cart -----------------------------

const loadCart = async (req, res) => {
  try {
    if (req.session.user_id) {
      const categoryData = await category.find({ is_delete: false });
      const userData = await users
        .find({ _id: req.session.user_id })
        .populate("cart.items.productId");

      const cart = userData[0].cart;
      // console.log(cart);
      res.render("cart", { categoryData, userData, cart });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addToCart = async (req, res) => {
  try {
    const size = req.body.size;
    const quantity = parseInt(req.body.quantity);
    const productId = req.body.id;
    const productData = await product.findById({ _id: productId });
    const userId = req.session.user_id;
    const userData = await users.findById({ _id: userId });

    const indexNumber = userData.cart.items.findIndex((productItem) => {
      return (
        new String(productItem.productId).trim() ==
        new String(productData._id).trim()
      );
    });
    if (indexNumber >= 0) {
      userData.cart.items[indexNumber].quantity += quantity;
    } else {
      userData.cart.items.push({
        productId: productId,
        quantity: quantity,
        size: size,
      });
      console.log(userData);
    }
    userData.cart.totalPrice += productData.price * quantity;
    const updated = await userData.save();

    res.redirect("/home/cart");
    // const cartItem = await
  } catch (error) {
    console.log(error.message);
  }
};

async function updateCartQuantity(userId, proId, count) {
  const updatedCart = await users
    .findOneAndUpdate(
      {
        _id: userId,
        "cart.items.productId": proId,
      },
      {
        $inc: {
          "cart.items.$.quantity": count,
        },
      },
      {
        new: true,
      }
    )
    .populate("cart.items.productId");

  return updatedCart;
}

const updateCart = async (req, res) => {
  try {
    const proId = req.body.id;
    const quantity = req.body.quantity;
    const count = req.body.count;
    console.log(proId);
    //////
    if (count == -1) {
      console.log("enter in to decrease");
      let data = await users
        .find({ _id: req.session.user_id })
        .populate("cart.items.productId");
      console.log(data[0].cart.items[0].productId.price);
      console.log("helllooo");
      let product = data[0].cart.items.find((product) => {
        return (
          new String(product.productId._id).trim() == new String(proId).trim()
        );
      });

      const subtotal = product.productId.price * product.quantity;
      console.log(subtotal);
      if (product.quantity <= 1) {
        const userData = await deleteItem(req.session.user_id, proId);

        userData.cart.totalPrice -= subtotal;
        updatedUser = await userData.save();
        res.json({
          delete: true,
          total: updatedUser.cart.totalPrice,
          user: updatedUser,
        });
      } else {
        console.log("decrease the quantity");
        const updatedCart = await updateCartQuantity(
          req.session.user_id,
          proId,
          count
        );
        const cart = updatedCart.cart;
        //for getting subtotal price of products
        let total = cart.items.reduce((total, item) => {
          return total + item.quantity * item.productId.price;
        }, 0);
        cart.totalPrice = total;
        const updatedQuantity = await updatedCart.save();
        //identify product for calculatin  product total price based on their quntity
        const product = updatedQuantity.cart.items.find((item) => {
          return item.productId._id.toString() == proId.toString();
        });

        const totalPrice = product.quantity * product.productId.price;
        res.json({ success: true, total, totalPrice });
      }
    } else {
      const updatedCart = await updateCartQuantity(
        req.session.user_id,
        proId,
        count
      );

      const cart = updatedCart.cart;
      //for getting subtotal price of products
      const total = cart.items.reduce((total, item) => {
        return total + item.quantity * item.productId.price;
      }, 0);
      cart.totalPrice = total;
      const updatedQuantity = await updatedCart.save();
      //identify product for calculatin  product total price based on their quntity
      const product = updatedQuantity.cart.items.find((item) => {
        return item.productId._id.toString() == proId.toString();
      });

      const totalPrice = product.quantity * product.productId.price;

      res.json({ success: true, total, totalPrice });
    }
  } catch (error) {
    console.log(error.message);
  }
};
// for deleting
async function deleteItem(userId, proId) {
  const userData = await users.findOneAndUpdate(
    { _id: userId },
    { $pull: { "cart.items": { productId: proId } } },
    { new: true }
  );
  return userData;
}

const deleteCartItem = async (req, res) => {
  try {
    const proId = req.query.id;
    const proTotalPrice = req.query.totalPrice;
    // normal remove the deleteItem funtion from here

    // const userData = await users.findOneAndUpdate({_id:req.session.user_id},{$pull:{'cart.items':{productId:proId}}},{new:true});
    const userData = await deleteItem(req.session.user_id, proId);

    userData.cart.totalPrice -= proTotalPrice;
    updatedUser = await userData.save();
    res.json({
      success: true,
      total: updatedUser.cart.totalPrice,
      user: updatedUser,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// ------------------------------------ profile -------------------------------------

const loadProfile = (req, res) => {
  return new Promise((resolve, reject) => {
    try {
      if (req.session.user_id) {
        // console.log('hello');
        const userData = users.find({ _id: req.session.user_id });
        const categoryData = category.find({ is_delete: false });
        Promise.all([userData, categoryData])
          .then(([userData, categoryData]) => {
            res.render("userProfile", { userData, categoryData });
            resolve();
          })
          .catch((error) => {
            console.log(error.message);
            reject(error);
          });
      } else {
        res.redirect("/home");
      }
    } catch (error) {
      console.log(error.message);
    }
  });
};

const updateProfile = async (req, res) => {
  try {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const phoneNumber = req.body.phoneNumber;
    const email = req.body.email;
    const userData = await users.findOneAndUpdate(
      { _id: req.session.user_id },
      {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phoneNumber: phoneNumber,
      }
    );
    await userData
      .save()
      .then(() => {
        res.redirect("/profile");
      })
      .catch((error) => {
        console.log(error.message);
      });
  } catch (error) {
    console.log(error.message);
  }
};

const addAddress = async (req, res) => {
  const address = {
    name: req.body.name,
    phoneNumber: req.body.phoneNumber,
    pinCode: req.body.pinCode,
    locality: req.body.locality,
    address: req.body.address,
    district: req.body.district,
    state: req.body.state,
  };
  try {
    await users.findByIdAndUpdate(req.session.user_id, {
      $push: { shippingAddress: { ...address } },
    });
    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
  }
};

const updateAddress = async (req, res) => {
  try {
  } catch (error) {
    console.log(error.message);
  }
};
// ---------------------- wish List ----------------------

const loadWishList = (req, res) => {
  try {
    return new Promise((resolve, reject) => {
      if (req.session.user_id) {
        const userData = users
          .findById(req.session.user_id)
          .populate("wishList.productId");
        const categoryData = category.find({ is_delete: false });
        Promise.all([userData, categoryData])
          .then(([userData, categoryData]) => {
            res.render("wishList", { userData, categoryData });
            resolve();
          })
          .catch((error) => {
            console.log(error);
            reject();
          });
      } else {
        const categoryData = category.find({ is_delete: false });
        Promise.all([categoryData])
          .then(([categoryData]) => {
            res.render("wishList", { categoryData });
          })
          .catch((error) => {
            console.log(error);
            reject();
          });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addToWishlist = async (req, res) => {
  if (req.session.user_id) {
    const pid = req.body.pid;
    const userData = await users.findById(req.session.user_id);
    const productData = await product.findById(pid);
    const wishListProduct = await userData.wishList.findIndex((product) => {
      return new String(product.productId).trim() == new String(pid).trim();
    });

    if (wishListProduct == -1) {
      userData.wishList.push({ productId: productData._id });
      const savedUser = await userData.save();
      // res.redirect('/home/wish-list')
      // const cartLength = savedUser.cart.items.length;
      const wishListLength = savedUser.wishList.length;
      res.json({ success: true, wishListLength });
    } else {
      res.redirect("/home");
    }
  } else {
    res.json({ login: true });
  }
};

const wishListToCart = async (req, res) => {
  try {
    const pId = req.body.pid;
    const productData = await product.findById(pId);
    let push = false;
    const userData = await users
      .findById({ _id: req.session.user_id })
      .populate("cart.items.productId");

    const cartExit = userData.cart.items.findIndex((product) => {
      return (
        new String(product.productId._id).trim() ==
        new String(productData._id).trim()
      );
    });

    const wishListIndex = userData.wishList.findIndex((product) => {
      return new String(product.productId._id).trim() == new String(pId).trim();
    });

    userData.wishList.splice(wishListIndex, 1);

    if (cartExit >= 0) {
      console.log("hello");
      userData.cart.items[cartExit].quantity += 1;
    } else {
      userData.cart.items.push({
        productId: pId,
        quantity: 1,
        size: productData.sizes,
      });
      push = true;
      console.log(push);
    }

    userData.cart.totalPrice += productData.price;
    savedUserData = await userData.save();

    res.json({ success: true, push, userData: savedUserData });
  } catch (error) {
    console.log(error.message);
  }
};

const deleteFromWishList = async (req, res) => {
  try {
    const pid = req.query.pid;
    users
      .findByIdAndUpdate(
        req.session.user_id,
        { $pull: { wishList: { productId: pid } } },
        { new: true }
      )
      .exec((error, data) => {
        if (error) {
          console.log(error.message);
        } else {
          res.json({ success: true, data });
        }
      });
  } catch (error) {
    console.log(error.message);
  }
};

//logout
const logout = async (req, res) => {
  try {
    req.session.user_id = "";

    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};
//404 page
const error404 = async (req, res) => {
  try {
    res.render("404", { message: "PAGE NOT FOUND" });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  direct,
  home,
  userLogin,
  LoadRegisteration,
  verifyLogin,
  insertUser,
  logout,
  verifyOtp,
  resendOtp,
  forgetPassword,
  FPsendOTP,
  fpVerifyOtp,
  loadnewPassword,
  newPassword,
  loadProducts,
  loadDetailsViewProduct,
  loadCart,
  addToCart,
  updateCart,
  deleteCartItem,
  loadProfile,
  updateProfile,
  addAddress,
  updateAddress,
  loadWishList,
  addToWishlist,
  wishListToCart,
  deleteFromWishList,
  error404,
};
