const jwt = require("jsonwebtoken")

exports.promiseBasedSignToken=async function(payload,options,JWT_SECRET_KEY){
    const promise=new Promise((resolve,reject)=>jwt.sign(payload,JWT_SECRET_KEY,options,(err,token)=>{
        if(err)return reject({is_valid:false,message:err.message})
        resolve({token})
    }))
    const {token}=await promise 
    return token
}