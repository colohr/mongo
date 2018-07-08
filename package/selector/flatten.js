const util = require('util')
const Operator = require('./Operator')
const Types = require('./Types')

//exports
module.exports = get_value

//shared actions
function build(updateData, operator, propertyName, value){
	if(Operator.isOperator(value)) return build(updateData, value.name, `${propertyName}.${operator}`, value.value())
	updateData[operator] = updateData[operator] || {}
	updateData[operator][propertyName] = value
	return updateData
}

function flatten(updateData, propertyName, propertyValue){
	if(isLeaf(propertyValue)) return propertyName ? build(updateData, '$set', propertyName, propertyValue):propertyValue

	if(Operator.isOperator(propertyValue)) return build(updateData, propertyValue.name, propertyName, propertyValue.value())

	var keys = Object.keys(propertyValue)
	if(!keys.length) return propertyName ? build(updateData, '$set', propertyName, propertyValue):updateData

	for(var i = 0; i < keys.length; i++){
		var key = keys[i]
		var newPrefix = !propertyName ? key:`${propertyName}.${key}`
		flatten(updateData, newPrefix, propertyValue[key])
	}

	return updateData
}

function get_value(value){ return flatten({}, null, value) }

function isBSONType(value){
	return value._bsontype && Types.BSON.indexOf(value._bsontype) > -1
}

function isLeaf(value){
	return value === null || typeof(value) === 'undefined' || isPrimitive(value) || isBSONType(value)
}

function isPrimitive(value){
	return Types.Primitive.indexOf(typeof (value)) > -1 || util.isArray(value) || util.isDate(value)
}

