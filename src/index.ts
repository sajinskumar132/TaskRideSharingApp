import Express from "express"
import {config} from "dotenv"
import { mongoDbConnect } from "./connection/mongoDb/mongoDbConnection"
import { graphqlHTTP } from "express-graphql"
import UserSchema from './handlers/userHandler/userHandler'
import DriverSchema from './handlers/driverHandler/driverHandlers'
config()
const app=Express()
app.use('/graphql/user',graphqlHTTP({schema:UserSchema,graphiql:true}))
app.use('/graphql/driver',graphqlHTTP({schema:DriverSchema,graphiql:true}))
function startServer(){
    mongoDbConnect(process.env.MongoUrl!).then(()=>{
        app.listen((process.env.Port),()=>{
            console.log('sever started')
        })
    })
}
startServer()