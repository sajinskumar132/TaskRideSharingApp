import { Schema, model } from "mongoose"

const driverModel =new Schema({
    userName:{type:String,required:true},
    emailId:{type:String,required:true,unique:true},
    password:{type:String,require:true,minlength:6},
    licenceNumber:{type:String,require:true},
    status:{type:String},
    documents:[{type:Schema.Types.ObjectId,ref:"driverDocuments"}],
    rides:[{type:Schema.Types.ObjectId,ref:"driverRides"}]
})

export default model('driver',driverModel)