const Chat=require("../model/Chat.js")['Chat']
const Message=require("../model/Message.js")['Message']

exports.createChat=async function(req,res){
    try{
    const {userId}=req.user
    if(userId===req.body.receiverId)return res.status(400).json({message:"Same user can't have chat"})
    const existedChat=await Chat.findOne({users:{$all:[userId,req.body.receiverId]}})
    if(!existedChat){
        const createdChat=await new Chat({users:[userId,req.body.receiverId]}).save()
        return res.status(201).json({chatId:createdChat["_id"]})
    }
    res.status(200).json({chatId:existedChat["_id"]})
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}

exports.getChats=async function(req,res){
    try{
    const {userId}=req.user
    const chats=await Chat.find({users:{$in:userId}}).populate({path:"users",match:{_id:{$ne:userId}}}).populate({path:"messages",match:{seenBy:{$nin:userId}}})
    res.status(200).json(chats)
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}

exports.readChat=async function (req,res){
    const {userId}=req.user
    try{
    await Message.updateMany({chatId:req.params.id,seenBy:{$nin:userId}},{$push:{seenBy:userId}})
    const chat=await Chat.findById(req.params.id).populate("messages").populate({path:"users",match:{_id:{$ne:userId}}})
    res.status(200).json(chat)
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}