const LogIn = async(req,res,next)=>{
    try {
        if(req.session.user_id  ){}
        else{
            res.redirect('/login')
        }next()
    } catch (error) {
        console.log(error.message);
    }
}

const LogOut = async(req,res,next) =>{
    try {
        if(req.session.user_id){
            res.redirect('/')
        }else{
            next();
        }
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    LogIn,LogOut
}