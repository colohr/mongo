const fxy = require('fxy')
const Projections = require('./projections')
const writes_error = ()=>new Error(`GraphQL.In: Invalid keyword used for endpoint call.  All calls that modify data or "In/Mutations" must be specified by the "mutation" keyword instead of the "query" keyword.`)
class GraphQLResolver extends Array{
	constructor({info,context,input}){ super(input,context,info) }
	get context(){ return this[this.length - 2] }
	get info(){ return this[this.length - 1] }
	get input(){ return this[this.length - 3] }
	get projections(){ return Projections(this) }
	get type(){ return get_type(this) }
	writes(){ return check_writes(this) } //check if current context is mutation & query has correct syntax
}

//exports
module.exports = resolver
module.exports.context_io = context_io

//shared actions
function check_writes(resolver){
	try{ if(context_io(resolver.info).writes) return resolver }
	catch(e){}
	throw writes_error()
}

function context_io(...x){
	const count = x.length
	const definition = get_definition(...x)
	const context = get_context(...x)
	const input = get_input(...x)
	return {
		context,
		count,
		directive(name){ return this.schema.getDirective(name) },
		get directives(){ return this.schema.getDirectives() },
		definition,
		input,
		get operation(){ return get_operation(this) },
		mutation(name){ return this.schema.getMutationType(name) },
		possible(name){ return this.schema.getPossibleTypes(name) },
		query(name){ return this.schema.getQueryType(name) },
		get schema(){ return this.definition.schema },
		type(name){ return this.schema.getType(name) },
		get types(){ return this.schema.getTypeMap() },
		get is_mutation(){ return this.operation.type === 'mutation' },
		get is_query(){ return this.operation === 'query' },
		get reads(){ return this.operation.type === 'query' },
		get writes(){ return this.operation.type === 'mutation' }
	}
}

function get_context(...x){
	const is = i=>fxy.is.data(i) && (i.constructor.name === 'Context' || i.constructor.name === 'IncomingMessage' || i.constructor.name === 'ClientRequest')
	return x.filter(is)[0]
}

function get_definition(...x){
	return x[x.length - 1]
}

function get_input(...x){
	const is = i=>fxy.is.data(i)
	return x.filter(is)[0]
}

function get_operation(io){
	const data = io.definition.operation
	return {
		field: io.definition.fieldName,
		type: data.operation,
		selections: get_selections(data.selectionSet),
		output: io.definition.returnType,
		container: io.definition.parentType,
		get data(){ return data }
	}

	//shared actions
	function get_selection(item){
		const name = item.name.value
		const inputs = get_selection_inputs(item.arguments)
		const selections = get_selections(item.selectionSet)
		return {field: name, inputs, selections}
	}

	function get_selection_inputs(x){
		let i = null
		if(fxy.is.array(x) && x.length){
			i = {}
			for(const input of x){
				const field = input.name.value
				const value = input
				i[field] = value
			}
		}
		return i
	}

	function get_selections(set){
		if(fxy.is.nothing(set)) return null
		const selection = new Map()
		//console.log(set)
		for(const i of set.selections){
			const item = get_selection(i)
			selection.set(item.field, item)
		}
		return selection
	}
}

function get_type(resolver){ return context_io(resolver.info).writes ? 'writes':'reads' }

function resolver(...x){
	return new GraphQLResolver({
		info: x.splice(x.length - 1, 1)[0],
		context: x.splice(x.length - 1, 1)[0],
		input: x.splice(x.length - 1, 1)[0]
	})
}
