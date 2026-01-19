const express=require("express")
const userController=require("../controller/user.js")

const router=express.Router()

router.patch("/post/save",userController.savePost).get("/post/created",userController.getCreatedPost).get("/post/saved",userController.getSavedPost).patch("/:id",userController.updateUser).get("/2FA-authenticator-setup",userController.generateAuthenticatorSetupUri)

exports.router=router