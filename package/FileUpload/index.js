const fxy = require('fxy')
const buffer = Symbol('file buffer')
class FileUpload{
	static get Bucket(){ return require('./Bucket') }
	static get middleware(){ return require('./middleware') }
	constructor(data){
		if(data.buffer) this[buffer] = data.buffer instanceof Buffer ? data.buffer:new Buffer(data.buffer)
		delete data.buffer
		Object.assign(this, data)
	}
	get buffer(){ return this[buffer] }
	get extension(){ return fxy.extension(this.file.name) }
	uri(){ return `data:${this.file.type};base64,${this.buffer.toString('base64')}` }

}

//exports
module.exports = FileUpload
