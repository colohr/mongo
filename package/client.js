const MongoDB = require('mongodb')
const {MongoClient} = MongoDB
const {Bucket} = require('./FileUpload')
const uri = require('./uri')
const index = {}

//exports
module.exports = MongoDB
module.exports.client = get_client
module.exports.bucket = get_bucket
module.exports.reader = get_reader
module.exports.writer = get_writer

//shared actions
async function get_bucket(name, info, ...x){ return Bucket(await get_db(name, 'writer'), info, ...x) }

async function get_client(type='reader'){
	if(type in index) return index[type]
	const client = await (new MongoClient(uri[type], {useNewUrlParser: true}).connect())
	if('list' in index === false){
		try{ await get_databases(client.db('admin')) }
		catch(e){}
	}
	return index[type] = client
}

async function get_databases(db){
	const admin = db.admin()
	const skip = ['admin', 'config', 'local', 'test']
	return index.list = (await admin.listDatabases()).databases.filter(item=>skip.includes(item.name) === false)
}

async function get_db(name, type){ return (await get_client(type)).db(name) }

function get_reader(){ return get_client('reader') }

function get_writer(){ return get_client('writer') }

