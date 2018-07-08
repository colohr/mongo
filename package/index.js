const client = require('./client')

//exports
module.exports = client
module.exports.collection = require('./collection')
module.exports.selector = require('./selector')
module.exports.resolver = require('./resolver')
module.exports.FileUpload = require('./FileUpload')