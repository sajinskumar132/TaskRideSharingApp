import { Schema, model } from "mongoose"

const driverRidesModel =new Schema({
    driverId:{type:String,required:true},
    userName:{type:String,required:true},
    pickUpLocation:{type:String,required:true},
    dropOffLocation:{type:String,required:true},
    status:{type:String,required:true},
  
})

export default model('driverRides',driverRidesModel)