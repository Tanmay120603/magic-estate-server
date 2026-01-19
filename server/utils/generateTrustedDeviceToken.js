const jwt = require("jsonwebtoken");
const { promiseBasedSignToken } = require("./promiseBasedSignToken");
require("dotenv").config()

async function generateTrustedDeviceToken(email){
    const trusted_device_token_age=1000*60*60*24*45
    const trusted_device_token=await promiseBasedSignToken({email},{expiresIn:"45d"},process.env.TRUSTED_DEVICE_TOKEN_SECRET_KEY)
    return {trusted_device_token_age,trusted_device_token}
}

exports.generateTrustedDeviceToken=generateTrustedDeviceToken