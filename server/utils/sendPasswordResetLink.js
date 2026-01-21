const { gmail} = require("../config/gmailClient")
const { buildEmail } = require("./buildEmail")
const { promiseBasedSignToken } = require("./promiseBasedSignToken")
require("dotenv").config()

exports.sendPasswordResetLink=async function(user){
   try{
    const {email,username,passkey_for_2FA}=user
    let token
    let redirect_url=process.env.FRONTEND_URL
    if(passkey_for_2FA){
        token=await promiseBasedSignToken({email,context:"FORGOT_PASSWORD_2FA"},{expiresIn:"3m"},process.env.TWOFA_GOOGLE_AUTHENTICATOR_TOKEN_SECRET_KEY)
        redirect_url=redirect_url+"/2FA/totp-verify?"
    }
    else{
       token=await promiseBasedSignToken({email},{expiresIn:"3m"},process.env.CHANGE_PASSWORD_TOKEN_SECRET_KEY)
       redirect_url=redirect_url+"/reset-password?"
    }
   
    const tokenSearchParams=new URLSearchParams({challengeToken:token})
    
    const raw=buildEmail({to:user.email,subject:"Password Reset",html:`<h1>Hi ${username}</h1>
           <a href=${redirect_url+tokenSearchParams} style="display: inline-block; padding: 10px 20px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #4CAF50; text-decoration: none; border-radius: 5px; margin-top: 20px; text-align: center;">Reset password</a>`})

    await gmail.users.messages.send({userId:"me",requestBody:{raw}})

    return {message:"Please check your email. If the address exists, we’ve sent an link."}
    }
    catch(err){
        console.log(err)
        throw new Error("Something went wrong while sending reset email")
    }

}