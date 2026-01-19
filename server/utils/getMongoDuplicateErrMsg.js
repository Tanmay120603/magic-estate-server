function getMongoDuplicateErrMsg(err){
    const field=Object.keys(err.keyValue)[0]
    return `${field} already exists`
}

exports.getMongoDuplicateErrMsg=getMongoDuplicateErrMsg