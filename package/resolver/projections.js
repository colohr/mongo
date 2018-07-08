const Selector = require('../selector')
const {context_io} = require('./')

//exports
module.exports = get_projections

//shared actions
function get_project_selector(project, selections){
	return new Proxy(project,{
		get: get_value,
		has: has_value
	})
	//shared actions
	function get_value(o,field){ return field in selections ? selections[field]:null }
	function has_value(o,field){ return field in selections }
}

function get_projection(projection){
	const data = {}
	for(const field in projection){
		if(typeof projection[field] === 'function') data[field] = projection[field]().projection
		else data[field] = 1
	}
	return {projection: Selector(data).$set}
}

function get_projections(resovler){
	const operation = context_io(resovler.info).operation
	const projections = {}
	for(const [field, item] of operation.selections){
		projections[field] = get_selections(item)
	}
	return projections
}

function get_selections(item){
	if(is_nest(item.selections)){
		const fields = Array.from(item.selections.keys())
		const selections = {}
		const project = function(){ return get_projection(this.selections) }
		for(const field of fields){
			selections[field] = get_selections(item.selections.get(field))
		}
		return get_project_selector(project.bind({selections, field:item.field}),selections)
	}
	return 1
}

function is_nest(item){ return item instanceof Map }