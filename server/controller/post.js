const Post=require("../model/Post.js")["Post"]
const User=require("../model/User.js")["User"]
const { verifyAuthTokens } = require("../utils/verifyAuthTokens.js")
require("dotenv").config()

exports.createPost=async function(req,res){
    try{
    const {userId}=req.user
    const {desc,utilities,petAllowance,deposit,size,school,bus,restraunt,...postOverView}=req.body
    const postDetail={desc,utilities,petAllowance,size,school,bus,restraunt,deposit}    
    const post=new Post({...postOverView,postDetail,user:userId})
    const createdPost=await post.save()
    await User.findByIdAndUpdate(userId,{$push:{Posts:createdPost["_id"]}},{new:true,runValidators:true})
    res.status(201).json({message:"Post created successfully",postID:createdPost["_id"]})
    }catch(err){
        res.status(500).json({message:err.message})
    }
}

exports.getPosts=async function (req,res){
    try{
    const maxPrice=+req.query.maxPrice || Number.MAX_SAFE_INTEGER 
    const minPrice=+req.query.minPrice || 1
    const bedroom=+req.query.bedroom || undefined
    const addressRegex=req.query.address ? "(?i)"+req.query.address+"(?-i)" : /[\s\S]+/g
    const type=req.query.type || undefined
    const property=req.query.property || undefined
    const posts=await Post.find({address:{$regex:addressRegex},bedroom,type,property,$and:[{price:{$gte:minPrice}},{price:{$lte:maxPrice}}]}).select({postDetail:0})
    res.status(200).json(posts)
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}

exports.getPost=async function(req,res){
    try{
        const postId=req.params.postId
        const post=await Post.findOne({_id:postId}).populate("user")
        const {accessToken,refreshToken}=req.cookies
        const {is_auth,payload}=await verifyAuthTokens("userAuth",accessToken,refreshToken,res)
        if(!is_auth)return res.status(200).json({...post["_doc"],isSave:false})
            
        const isSave=await User.findOne({username:payload.username,savedPost:{$in:postId}})   
        if(isSave)return res.status(200).json({...post["_doc"],isSave:true})
        return res.status(200).json({...post["_doc"],isSave:false})
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}

exports.autocompleteSearch=async function (req,res){
    try{
        const address=req.query.address || "a"
        const typeRegex=req.query.type ? `${req.query.type}` : /[\s\S]+/g
        const propertyRegex=req.query.property ? `${req.query.property}` : /[\s\S]+/g
        const autoCompletePost=await Post.aggregate([
            {$search:{index:"autoComplete",autocomplete:{query:address,path:"address"}}},
            {$match:{type:{$regex:typeRegex},property:{$regex:propertyRegex}}},
            {$limit:10},
            {$project:{address:1,city:1,score:{$meta:"searchScore"}}}
        ])
        res.status(200).json(autoCompletePost)
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}