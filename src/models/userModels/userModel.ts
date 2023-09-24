import { Schema, model } from "mongoose"

const UserModel =new Schema({
    userName:{type:String,required:true},
    emailId:{type:String,required:true,unique:true},
    password:{type:String,require:true,minlength:6},
    bookings:[{type:Schema.Types.ObjectId,ref:'rideBooking'}]
})

export default model('user',UserModel)