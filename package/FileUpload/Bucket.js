const MongoDB = require('mongodb')
const {GridFSBucket} = MongoDB
const {Readable} = require('stream')

class FileBucket{
	constructor({bucket, database, info}, files=[], user=null){
		this.bucket = bucket
		this.database = database
		this.collection = database.collection(info.collection)
		this.info = info
		this.files = files
		this.user = user
		this.list = []
		this.saved = new Map()
	}
	async delete(id){
		const bucket_delete = await this.bucket.delete(id)
		const record_delete = await this.collection.deleteOne({_id:id})
		return {
			bucket:bucket_delete,
			record:record_delete
		}
	}
	data(file){ return Object.assign(file,this.info) }
	next(){
		if(this.uploading  === false) return this
		return this.save(this.files.splice(0,1)[0])
	}
	open(name){ return this.bucket.openUploadStream(name) }
	reopen(id){ return this.bucket.openUploadStreamWithId(id) }
	async save(file){
		const record = await save_file(this, file)
		if(record) this.saved.set(record.name, record._id)
		this.list.push(record)
		return this.next()
	}
	selector(selector){ return Object.assign({ _user:this.user._id }, selector || {}) }
	start(files, user){ return start_upload(this,files,user) }
	get uploading(){ return this.files.length > 0 }
}

//exports
module.exports = create_bucket

//shared actions
async function create_bucket(database, info = {}, input, context){
	if(!info.database) info.database = database.databaseName
	if(!info.collection) info.collection = 'file.uploads'
	if(!info.bucket) info.bucket = info.collection
	return new FileBucket({
		bucket: new GridFSBucket(database, {bucketName: info.bucket}),
		database,
		info
	}, input ? input.files:[], context ? await context.user:null)
}

function get_stream(buffer){
	const readable = new Readable()
	readable.push(buffer)
	readable.push(null)
	return readable
}

async function save_file(bucket, record){
	console.log(`Saving bucket file: ${record.name}`)
	try{
		if(bucket.saved.has(record.name)) {
			await bucket.delete(bucket.saved.get(record.name))
			bucket.saved.delete(record.name)
		}

		const stream = get_stream(record.buffer)
		const upload = bucket.open(record.name)
		record._id = upload.id
		record._user = bucket.user._id
		record._file = bucket.data({id: upload.id, name: record.name })
		console.log('Streaming file...')
		return await get_upload_promise(stream, upload)
	}
	catch(e){
		console.log(e.stack)
		throw e
	}

	//shared actions
	function get_upload_promise(stream, upload){
		return new Promise((success, error)=>{
			console.log('Listening to events of uploadStream ')
			upload.on('error', on_error)
			upload.on('finish', on_finish)
			return stream.pipe(upload)
			//shared actions
			function on_error(e){
				console.log('Error uploading file')
				console.error(e)
				return error(e)
			}

			async function on_finish(){
				console.log('Stream finished...')
				try{

					record._date = {created: new Date()}
					await bucket.collection.updateOne({_id: record._id}, {$set: record}, {upsert: true})
					const data = await bucket.collection.findOne({_id: record._id})
					return success(data)
				}
				catch(e){
					console.error(e)
					return error(e)
				}
			}
		})
	}
}

function start_upload(bucket, files, user){
	if(files) bucket.files = files
	if(user) bucket.user = user
	if(!bucket.user) throw new Error(`File uploads require an authenticated user.`)
	return preset()

	//shared actions
	async function preset(){
		const cursor = await bucket.collection.find(bucket.selector(), {$projection: {_id: 1, name: 1}})
		const saved = await cursor.toArray()
		for(const item of saved) bucket.saved.set(item.name, item._id)
		return bucket.next()
	}
}