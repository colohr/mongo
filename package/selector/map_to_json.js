//exports
module.exports = map_to_json
//shared actions
function map_to_json(map){
	const fields = Array.from(map.keys())
	const data = {}
	for(const field of fields){
		let value = map.get(field)
		if(value instanceof Map) data[field] = map_to_json(value)
		else data[field] = value
	}
	return data
}