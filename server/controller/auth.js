const User=require("../model/User.js")["User"]
const bcrypt=require("bcryptjs")
const path=require("path")
const speakEasy=require("speakeasy")
const { getMongoDuplicateErrMsg } = require("../utils/getMongoDuplicateErrMsg.js")
const { generateTokens } = require("../utils/generateTokens.js")
const {sendEmailVerificationOtp}= require("../utils/sendEmailVerificationOtp.js")
const { OtpModel } = require("../model/Otp.js")
const { checkTrustedDeviceTokenStatus } = require("../utils/checkTrustedDeviceTokenStatus.js")
const { generateTrustedDeviceToken } = require("../utils/generateTrustedDeviceToken.js")
const { setAuthTokenInCookie } = require("../utils/setAuthTokensInCookie.js")
const { promiseBasedVerifyToken } = require("../utils/promiseBasedVerifyToken.js")
const { RefreshTokenModel } = require("../model/RefreshToken.js")
const { sendPasswordResetLink } = require("../utils/sendPasswordResetLink.js")
const { promiseBasedSignToken } = require("../utils/promiseBasedSignToken.js")
require('dotenv').config()

exports.registerUser=async function(req,res){
    try{
    const user=new User(req.body)
    const hashedPassword=await bcrypt.hash(user.password,10)
    user.password=hashedPassword
    await user.save()
    const {message,challengeToken}=await sendEmailVerificationOtp(user,"EMAIL_VERIFY",{email:user.email})
    res.json(201,{message,challengeToken})
    }
    catch(err){
        //Handling duplicate value error response 
        if(err.code===11000)return res.json(409,{message:getMongoDuplicateErrMsg(err)})

        //Handling mongoose validation error response
        if(err.name==="ValidationError"){
            const error=Object.keys(err.errors).map(field=>{
                return {field,message:err.errors[field]["message"]}
            })
           return res.json(400,{error})
        }
        //Handling internal server side error response
        res.json(500,{message:"Something went wrong!. Internal server error"})
    }
}

exports.loginUser=async function(req,res){
    try{
        const user=await User.findOne({email:req.body.email})
        if(!user){
            return res.json(400,{message:"Email or password is incorrect"})
        }
        if(!user.password)return res.json(400,{message:"You can only login through google. To avoid this set password"})
        const isCorrectPassword=await bcrypt.compare(req.body.password,user.password)
        if(!isCorrectPassword){
           return res.json(400,{message:"Email or password is incorrect"})
        }
       const {is_valid,message}=await checkTrustedDeviceTokenStatus(req)
       console.log(is_valid,message)
       if(is_valid){
        const {username,email:userEmail,_id:userId,avatar,createdAt,passkey_for_2FA}=user
        const {accessToken,refreshToken,accessTokenAge,refreshTokenAge}=await generateTokens({username,userEmail,userId})
        setAuthTokenInCookie(res,accessToken,refreshToken,accessTokenAge,refreshTokenAge)
        const userInfo={username,email:userEmail,userId,avatar,createdAt,is_2FA_enabled:passkey_for_2FA?true:false}
        return res.json(200,{message:"Login done successfully",is_auth:true,userInfo})
       }
       const {challengeToken}=await sendEmailVerificationOtp(user,"LOGIN_2FA",{email:user.email,remember_me:req.body.remember_me})
       console.log(challengeToken)
       res.json(401,{
        challengeToken,
        code: "2FA_REQUIRED",
        message: "Additional verification is required. A one-time code has been sent to your email."})
    }
    catch(err){
        res.json(500,{message:"Internal Server Error"})
    }
}

exports.verifyOtp=async function(req,res){
    try {
    const {challengeToken,otp}=req.body
    const {is_valid,payload}=await promiseBasedVerifyToken(challengeToken,process.env.TWOFA_EMAIL_TOKEN_SECRET_KEY)
    if(!is_valid)return res.json(401,{message:"Invalid Challenge token!. Please repeat intial setup again",authStep:"LOGIN_REQUIRED"})
    const {email,sessionId,remember_me,context}=payload
    
    const otpDoc=await OtpModel.findOne({email,sessionId})
    if(!otpDoc)return res.json(410,{message:"Otp has expired, please resend it"})
    
    const user=await User.findOne({email})
    if(user?.is_email_verified && context==="EMAIL_VERIFY" )return res.json(409,{message:"Email is already verified please login"})


    //Check to see if otp is invalid and no of verify_otp_attempts is reached    
    const verify_attempt_no=otpDoc.verify_attempts+1
    if(otpDoc.otp!==otp){
        if(verify_attempt_no>=process.env.EMAIL_VERIFY_ATTEMPT_LIMIT){
           await otpDoc.deleteOne()
           return res.json(400,{message:"Invalid otp!, Number of email verification attempt is reached, resend new otp",verify_attempt_no})
        }    
        await otpDoc.updateOne({verify_attempts:verify_attempt_no})
        return res.json(400,{message:`Invalid Otp!`,verify_attempt_no})
    }

    if(otpDoc.context==="EMAIL_VERIFY")await user.updateOne({is_email_verified:true})
    if(otpDoc.context==="LOGIN_2FA" && remember_me){
        const {trusted_device_token_age,trusted_device_token}=await generateTrustedDeviceToken(email)
        res.cookie("trusted_device_token",trusted_device_token,{httpOnly:true,maxAge:trusted_device_token_age,secure:process.env.BUILD=="prod"})
    }
    const {username,email:userEmail,_id:userId,avatar,createdAt,passkey_for_2FA}=user
    const userInfo={username,email:userEmail,userId,avatar,createdAt,is_2FA_enabled:passkey_for_2FA?true:false}
    const {accessToken,refreshToken,accessTokenAge,refreshTokenAge}=await generateTokens({username,userEmail,userId})
    setAuthTokenInCookie(res,accessToken,refreshToken,accessTokenAge,refreshTokenAge)
    res.json(200,{message:"Otp is verified successfully",is_auth:true,userInfo})
}
    catch(err){
        res.json(500,{message:"Something went wrong!. Internal server error"})
    }
}

exports.resendOtp=async function(req,res){
    try{
    const {challengeToken}=req.body
    const {is_valid,payload}=await promiseBasedVerifyToken(challengeToken,process.env.TWOFA_EMAIL_TOKEN_SECRET_KEY)
    if(!is_valid)return res.json(401,{message:"Invalid challenge token!. Please repeat intial setup again",authStep:"LOGIN_REQUIRED"})

    const {otpContext,sessionId,iat,exp,...extra}=payload
    await OtpModel.deleteOne({sessionId,email:extra.email})

    const user=await User.findOne({email:extra.email})
    const {challengeToken:newChallengeToken}=await sendEmailVerificationOtp(user,otpContext,extra)
    res.json(201,{message:"Otp has been re-send successfully to your email",challengeToken:newChallengeToken})
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}

exports.logoutUser=async function (req,res){
    try{
    const {refreshToken}=req.cookies
    await RefreshTokenModel.deleteOne({refreshToken})
    res.clearCookie("accessToken").clearCookie("refreshToken").status(200).json({message:"Logged out successfully"})
    }catch(err){
     res.status(500).json({message:"Internal server error"})   
    }
}

exports.forgotPassword=async function(req,res){
    try {
        const {email}=req.body
        const user=await User.findOne({email:email||""})
        if(!user)return res.json(404,{message:"User not found linked to this email"})
        const {message}=await sendPasswordResetLink(user)
        res.json(200,{message})       
    } 
    catch (err) {
        res.json(500,{message:"Internal server error"})
    }
}

exports.changePassword=async function(req,res){
    try{
    const {resetChallengeToken,password:new_password}=req.body
    if(new_password?.trim().length<6)return res.json(400,{message:"Password length must be atleast 6 characters"})
    const {is_valid,payload}=await promiseBasedVerifyToken(resetChallengeToken,process.env.CHANGE_PASSWORD_TOKEN_SECRET_KEY)
    if(!is_valid)return res.json(400,{message: "This password reset link is invalid or has expired. Please request a new one."})
    
    const user=await User.findOne({email:payload.email})
    const isEqualToOldPassword=await bcrypt.compare(new_password,user.password)
    if(isEqualToOldPassword)return res.json(400,{message:"Please set new password"})
    
    await RefreshTokenModel.deleteMany({username:user.username})
    const hashed_new_password=await bcrypt.hash(new_password,10)
    user.password=hashed_new_password
    await user.save()

    res.json(200,{message:"Password is updated successfully"})
    }
    catch(err){
        res.json(500,{message:"Internal server error"})
    }
}

exports.googleAuthIntiate=async function(req,res){
    try{
        const params=new URLSearchParams({
        client_id:process.env.GOOGLE_AUTH_CLIENT_ID,
        redirect_uri:"http://localhost:8080/api/auth/google/callback",
        response_type:"code",
        scope:"openid email profile",
        prompt:"select_account",
        state:"confirmation"
    })
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
    }
    catch(err){
        res.json(500,{message:"Internal server error"})
    }
}

exports.googleAuthSuccessCallback=async function(req,res){
    try{
    const {code,state}=req.query
    if(state==="confirmation")return res.sendFile(path.resolve(__dirname,"..","public","oauth-confirm.html"))
    const resAccessToken=await fetch("https://oauth2.googleapis.com/token",{method:"POST",
        headers:{ "Content-type": "application/json; charset=UTF-8"},
        body:JSON.stringify({
            client_id: process.env.GOOGLE_AUTH_CLIENT_ID,
            client_secret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
            code,
            redirect_uri: "http://localhost:8080/api/auth/google/callback",
            grant_type: "authorization_code",  
        })
    })
    const {access_token}=await resAccessToken.json()
    const resProfile=await fetch("https://www.googleapis.com/oauth2/v2/userinfo",{method:"GET",
        headers:{
              Authorization: `Bearer ${access_token}`
        }
    })
    const {email,name,id:googleId}=await resProfile.json()
    const user=await User.findOne({email})
    let username=user?.username
    let userId=user?._id
    if(!user){
        username=name.replace(/\s+/g,"")+crypto.randomUUID().split("-")[0]
        const {_id}=await new User({username,email,is_email_verified:true}).save()
        userId=_id
    }
    if(user?.passkey_for_2FA){
        const challengeToken=await promiseBasedSignToken({context:"GOOGLE_LOGIN_2FA",email,username,userId},{expiresIn:"3m"},process.env.TWOFA_GOOGLE_AUTHENTICATOR_TOKEN_SECRET_KEY)
        const tokenSearchParams=new URLSearchParams({challengeToken})
        return res.redirect(process.env.FRONTEND_URL+"2FA/totp-verify?"+tokenSearchParams)
    }
    const {accessToken,accessTokenAge,refreshToken,refreshTokenAge}=await generateTokens({username,userEmail:email,userId})
    setAuthTokenInCookie(res,accessToken,refreshToken,accessTokenAge,refreshTokenAge)
    res.redirect(process.env.FRONTEND_URL+"/profile")
    }
    catch(err){
        res.json(500,{message:"Internal server error"})
    }
}

exports.googleAuthenticatorVerifyTotp=async function(req,res){
    try{
    const {challengeToken,totp}=req.body
    const {is_valid,payload}=await promiseBasedVerifyToken(challengeToken,process.env.TWOFA_GOOGLE_AUTHENTICATOR_TOKEN_SECRET_KEY)
    if(!is_valid)return res.json(400,{message:"This token is invalid or has expired. Please do the initial setup again."})
    const {context,email}=payload
    let passKey=payload.passKey
    if(context!=="2FA_SETUP"){
        const {passkey_for_2FA}=await User.findOne({email})
        passKey=passkey_for_2FA
    }
    const is_totp_valid=speakEasy.totp.verify({
        secret:passKey,
        encoding:"base32",
        token:totp,
        window:0
    })
    if(!is_totp_valid)return res.json(400,{message:"Invalid otp please provide valid otp"})

    if(context==="2FA_SETUP"){
        await User.findOneAndUpdate({email},{passkey_for_2FA:passKey})
        return res.json(200,{message:"2FA authentication setup is completed successfully"})
    }
    if(context==="GOOGLE_LOGIN_2FA"){
        const {accessToken,refreshToken,accessTokenAge,refreshTokenAge}=await generateTokens({username:payload.username,userEmail:email,userId:payload.userId})
        setAuthTokenInCookie(res,accessToken,refreshToken,accessTokenAge,refreshTokenAge)
        return res.json(200,{message:"Login is completed successfully",is_auth:true})
    }
    if(context==="FORGOT_PASSWORD_2FA"){
        const resetChallengeToken=await promiseBasedSignToken({email},{expiresIn:"3m"},process.env.CHANGE_PASSWORD_TOKEN_SECRET_KEY)
        return res.json(200,{resetChallengeToken,allow_password_change:true,message:"Otp verified successfully!. Now password can be changed"})
    }
    }
    catch(err){
        res.json(500,{message:"Internal server error"})
    }
}

exports.getCurrentUser=async function(req,res){
    try{
        const {userId}=req.user
        const {username,email,avatar,createdAt,passkey_for_2FA}=await User.findById(userId)
        const userInfo={userId,username,email,avatar,createdAt,is_2FA_enabled:passkey_for_2FA ? true : false}
        res.json(200,{userInfo,is_auth:true})
    }
    catch(err){
        res.json(500,{message:"Internal server error"})
    }
}