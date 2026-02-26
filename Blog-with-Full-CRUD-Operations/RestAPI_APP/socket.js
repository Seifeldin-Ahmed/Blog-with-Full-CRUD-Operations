let io;
import socketIo from 'socket.io';
export default {
    init: httpServer => {
        io = socketIo(httpServer);
        return io;
    },
    getIO: () => {  
        if(!io){
            throw new Error('Socket.io is not initialized!');
        }
        return io;
    }
};