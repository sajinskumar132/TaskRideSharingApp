import {connect} from "mongoose"

export  const mongoDbConnect=async(Url:string)=>{
    try {
        await connect(Url).then(()=>{
            console.log('MongoDbConnected')
        })
    } catch (error) {
        console.log(error)
    }

}