const jwt=require("jsonwebtoken")
require("dotenv").config()

exports.checkTrustedDeviceTokenStatus=async function(req){
    try{
    const {trusted_device_token}=req.cookies || ""
    if(!trusted_device_token)return {is_valid:false,message:"Token doesn't exist"}
    const promise=new Promise((resolve,reject)=>{
        jwt.verify(trusted_device_token,process.env.TRUSTED_DEVICE_TOKEN_SECRET_KEY,(err,payload)=>{
            if(err)return reject({is_valid:false,message:"Token is invalid"})
            if(payload.email!==req.body.email)return reject({is_valid:false,message:"Token is invalid"})
            resolve({is_valid:true,message:"Token is valid"})
        })}
    )
    const {is_valid,message}=await promise
    return {is_valid,message}
    }
    catch(err){
        return err
    }
}