import { Schema, model } from "mongoose";

const RideBookingModel= new Schema({
    userId:{type:String,required:true},
    pickUpLocation:{type:String,required:true},
    dropOffLocation:{type:String,required:true},
    personsCount:{type:Number,required:true},
    vehicleCategory:{type:String,required:true},
    pickUpScheduleTime:{type:String,required:true},
    payment:{type:String,required:true},
    Status:{type:String,required:true}
})
export default model('rideBooking',RideBookingModel)
