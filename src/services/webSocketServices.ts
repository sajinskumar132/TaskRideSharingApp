import { Server } from "socket.io";
import http from 'http'
export default class WebSocketSetup{
    static io: Server
    static InitialConnection(server:http.Server){
        this.io = new Server(server);
        this.io.on('connect', () => {
            this.io.emit('Status',"Connected")
        });
    }

    static EmitMessage(message:string){
        this.io.emit('Updates',message)
    }
}