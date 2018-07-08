const stream = require('data.stream')
const fxy = require('fxy')

//exports
module.exports = function create_multipart_middleware(...options){
	return stream.middleware(on_middleware_data, ...options)
	//shared actions
	function on_middleware_data(data, request, response, next){
		if(data.error) console.error(data.error)
		if(data.error) return response.json(data)
		try{
			request.body = get_body(data.fields,data.files)
		}catch(e){
			console.log(e)
		}


		return next()
	}
}

function get_body(fields, files){
	const body = {}
	body.query = fields['graphql.query']
	body.variables = get_variables(fields, files)
	return body
}

function get_variables(fields, files){
	try{
		const variables = JSON.parse(fields['graphql.variables'])
		variables.files = variables.files.map(get_file_details).map(record=>get_file_upload(record,files))
		return variables
	}
	catch(e){
		throw e
	}
	//shared actions
	function get_file_details(item){
		if(fxy.is.data(item)) return item
		return {name: item, type: 'any'}
	}
}

function get_file_upload(record, files){
	return Object.assign(files[record.name], record)
}
