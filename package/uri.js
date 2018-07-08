const fxy = require('fxy')
const environment = get_environment()
const webapp = environment.webapp ? environment.webapp:'app'
const accounts = get_accounts()
const hostname = 'localhost'
const mechanism = 'DEFAULT'

//exports
module.exports = new Proxy(accounts,{
    get(o,field){ return field in o.users ? get_uri(o.users[field]):null },
    has(o,field){ return field in o.users }
})

//shared actions
function get_accounts(){ return require(get_accounts_location()) }
function get_accounts_location(){
	if(environment.accounts) return environment.accounts
    else if(environment.accounts_location) return `${environment.accounts_location}/${webapp}.mongodb.json`
    return fxy.join(process.cwd(),`/accounts/${webapp}.mongodb.json`)
}

function get_environment(){
    return process.argv.slice(2).map(i=>get_field_value(i)).reduce((data,item)=>Object.assign(data,item),{})
    //shared actions
    function get_field_value(item, parts=null){
		let field = item
        let value = true
        if(item.includes('=')){
            parts = item.split('=')
            field = parts[0]
            value = parts[1]
        }
        else if(item.includes(':')){
			parts = item.split(':')
			field = parts[0]
			value = parts[1]
        }
		field = fxy.id.underscore(field)
        return {[field]:value}
    }
}

function get_uri(account){
    if(!fxy.is.data(account)) throw new Error(`database: Invalid account to create MongoDB uri.`)
    return require('util').format('mongodb://%s:%s@%s:%s/admin?authMechanism=%s', encodeURIComponent(account.user), encodeURIComponent(account.password), hostname, accounts.port, mechanism)
}
