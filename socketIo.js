import { Server as SocketIo } from 'socket.io'
import redis from 'socket.io-redis'

function registerSocketIo(config, server) {
    const io = new SocketIo(server);
    io.adapter(redis({ host: config.redisHost, port: config.redisPort }));
    return io
}

export default registerSocketIo