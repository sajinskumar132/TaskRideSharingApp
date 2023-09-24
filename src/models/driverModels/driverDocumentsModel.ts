import { Schema, model } from "mongoose"

const driverDocumentsModel =new Schema({
    userid:{type:String,required:true},
    licenseNumber:{type:String,required:true,unique:true},
    licenceImage:{type:String,require:true},
    vehicleNumber:{type:String,require:true,unique:true},
    vehicleCategory:{type:String,required:true}
})

export default model('driverDocuments',driverDocumentsModel)