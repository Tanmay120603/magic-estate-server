const express=require("express")
const router=express.Router()
const authController=require("../controller/auth.js")
const { verifyToken } = require("../middleware/verifyToken.js")

router.post("/register",authController.registerUser).post("/login",authController.loginUser).post("/logout",verifyToken,authController.logoutUser).post("/verify-otp",authController.verifyOtp).post("/resend-otp",authController.resendOtp).post("/forgot-password",authController.forgotPassword).post("/change-password",authController.changePassword).get("/google",authController.googleAuthIntiate).get("/google/callback",authController.googleAuthSuccessCallback).post("/google/verify-totp",authController.googleAuthenticatorVerifyTotp).get("/me",verifyToken,authController.getCurrentUser)

exports.router=router