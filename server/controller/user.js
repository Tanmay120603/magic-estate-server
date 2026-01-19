const User=require("../model/User.js")["User"]
const speakEasy=require("speakeasy")
const QrCode=require("qrcode")
const { promiseBasedSignToken } = require("../utils/promiseBasedSignToken.js")
require("dotenv").config()


exports.updateUser=async function(req,res){
    try{
    const {userId}=req.user
    const user=await User.findByIdAndUpdate(userId,req.body,{runValidators:true,new:true})
    const {password,passkey_for_2FA,...updatedUser}=user["_doc"]
    res.status(200).json(updatedUser)
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}

exports.getCreatedPost=async function(req,res){
    try{
        const {userId}=req.user
        const user=await User.findById(userId).populate("Posts")
        res.status(200).json(user?.Posts)
    }
    catch(err){
        res.status(500).json({message:"Internal server error"})
    }
}

exports.savePost=async function(req,res){
    try{
        const {userId,username}=req.user
        const postId=req.body.postId
        
        const isOwnPost=await User.findOne({username,Posts:{$in:postId}})
        if(isOwnPost)return res.json(400,{message:"User can't save their own created post."})

        const isSave=await User.findOne({username,savedPost:{$in:postId}})
        if(isSave){
            await User.findByIdAndUpdate(userId,{$pull:{savedPost:postId}})
            return res.status(200).json({message:"Post is removed from saved post"})
        }
        await User.findByIdAndUpdate(userId,{$push:{savedPost:postId}})
        return res.status(200).json({message:"Post is added to saved post"})
    }
    catch(err){
        res.status(500).json({message:"Internal server error. Failed to save post"})
    }
}

exports.getSavedPost=async function(req,res){
    try{    
        const {userId}=req.user
        const user=await User.findById(userId).populate("savedPost")
        res.status(200).json(user?.savedPost)
    }
    catch(err){
        res.status(500).json({message:"Internal server error"})
    }
}

exports.generateAuthenticatorSetupUri=async function(req,res){  
    try{
    const {userEmail}=req.user 
    const secret=speakEasy.generateSecret({name:`MagicEstate ${userEmail}`})
    const qrCodeUrl=await QrCode.toDataURL(secret.otpauth_url)
    const challengeToken=await promiseBasedSignToken({passKey:secret.base32,context:"2FA_SETUP",email:userEmail},{expiresIn:"5m"},process.env.TWOFA_GOOGLE_AUTHENTICATOR_TOKEN_SECRET_KEY)
    res.json(202,{message:"Now you need to verify the totp to complete the setup",qrCodeUrl,challengeToken})
    }
    catch(err){
        res.json(500,{message:"Internal server error"})
    }
}