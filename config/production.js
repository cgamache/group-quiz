
function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
        // named pipe
        return val;
    }
  
    if (port >= 0) {
        // port number
        return port;
    }
  
    return false;
  }
  
  export default {
    redisHost: process.env.REDIS_HOST,
    redisPort: normalizePort(process.env.REDIS_PORT) || 6379
  }