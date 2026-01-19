const Message=require("../model/Message.js")['Message']

exports.getUnreadMessages=async function(req,res){
    const {userId}=req.user
    try{
    const unreadMessagesCount=await Message.countDocuments({receiverId:userId,seenBy:{$nin:userId}})
    res.status(200).json(unreadMessagesCount)
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}