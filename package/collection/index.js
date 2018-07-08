const CollectionRecordTools = collection => ({
	exists(...x){ return record_exists(collection,...x) }
})

//exports
module.exports = CollectionRecordTools

//shared actions
async function record_exists(collection, ...x){
	return await collection.count(...x) !== 0
}