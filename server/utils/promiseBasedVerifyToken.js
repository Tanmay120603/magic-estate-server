const jwt = require("jsonwebtoken")

exports.promiseBasedVerifyToken=async function(token,JWT_SECRET_KEY){
   try{ 
    const promise=new Promise((resolve,reject)=>jwt.verify(token,JWT_SECRET_KEY,(err,payload)=>{
        if(err)return reject({is_valid:false,message:err.message})
        resolve({is_valid:true,payload})
    }))
    const {is_valid,payload}=await promise
    return {is_valid,payload}
    }
    catch(err){
        return err 
    }
}