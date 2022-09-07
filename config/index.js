import development from './development.js'
import production from './production.js'

const config = {development, production}

export default config[process.env.NODE_ENV || 'development']