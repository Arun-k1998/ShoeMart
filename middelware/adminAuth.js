const logIn = async(req,res,next)=>{
    try {
        if(req.session.adminid){}
        else{
            res.redirect('/admin')
        }
        next()
    } catch (error) {
        console.log(error.message)
    }
}

const logOut = async(req,res,next)=>{
    try {
        if(req.session.adminid){
            res.redirect('/admin/home')
        }else{
            next()
        }
    } catch (error) {
        console.log(error.message)
    }
}

module.exports= {
    logIn,
    logOut
}