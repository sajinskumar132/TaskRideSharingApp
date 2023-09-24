import Express from "express"
import {config} from "dotenv"
import { mongoDbConnect } from "./connection/mongoDb/mongoDbConnection"
import { graphqlHTTP } from "express-graphql"
import UserSchema from './handlers/userHandler/userHandler'
import DriverSchema from './handlers/driverHandler/driverHandlers'
import cors from 'cors'
import http from 'http'
import WebSocketSetup from "./services/webSocketServices"
config()
const app=Express()
app.use(cors())
const server = http.createServer(app)

app.use('/graphql/user',graphqlHTTP({schema:UserSchema,graphiql:true}))
app.use('/graphql/driver',graphqlHTTP({schema:DriverSchema,graphiql:true}))

WebSocketSetup.InitialConnection(server)

function startServer(){
    try {
        mongoDbConnect(process.env.MongoUrl!).then(()=>{
            server.listen((process.env.Port),()=>{
                console.log('sever started')
            })
        })
    } catch (error) {
        console.log(error)
    }
    
}
startServer()