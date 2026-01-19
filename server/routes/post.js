const express=require("express")
const { createPost, getPosts, getPost, autocompleteSearch} = require("../controller/post")
const { verifyToken } = require("../middleware/verifyToken")

const router=express.Router()

router.post("/",verifyToken,createPost).get("/",getPosts).get("/autocomplete",autocompleteSearch).get("/:postId",getPost)

exports.router=router