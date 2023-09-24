import { GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { userSchemaType } from "../../schemas/userSchema/userSchema";
import user from '../../models/userModels/userModel'
import driver from '../../models/driverModels/driverModel'
import rideBooking from '../../models/userModels/rideBookingModel'
import  driverRides from '../../models/driverModels/driverRidesModel'
import {compareSync, hashSync} from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { RideBookingSchemaType } from "../../schemas/userSchema/rideBookingSchema";
import {startSession} from "mongoose"
import WebSocketSetup from "../../services/webSocketServices";
import { IDriverDocument, INewBooking, IVehicleCategory } from "../../InterfacesAndEnums/InterfacesAndEnums";
const UserQuery=new GraphQLObjectType({
    name:"Query",
    fields:{
        getAllUser:{
            type:new GraphQLList(userSchemaType),
            async resolve(){
                return await user.find()
            }
        },
        getUserById:{
            type:userSchemaType,
            args:{
                id:{type: new GraphQLNonNull(GraphQLID)}
            },
            async resolve(_,{id}){
                return await user.findById(id)
            }
        }
    }
})

const UserMutation=new GraphQLObjectType({
    name:"Mutation",
    fields:{
        signUp:{
            type:userSchemaType,
            args:{
                userName:{type:new GraphQLNonNull(GraphQLString)},
                emailId:{type:new GraphQLNonNull(GraphQLString)},
                password:{type:new GraphQLNonNull(GraphQLString)}
            },
            async resolve(_,{userName,emailId,password}){
                try {
                    let existingUser=await user.findOne({emailId})
                    if(existingUser) return new Error(`User with the email address ${emailId}  already exists.`)

                    const errors = []
                    if (!userName) {
                      errors.push("User name is required.");
                    }
                    if (!emailId) {
                      errors.push("Email address is required.");
                    }
                    if (!password) {
                      errors.push("Password is required.");
                    }

                    if (errors.length > 0) return new Error(errors.toString())
                    if(password.length<5) return new Error("The password length should be a minimum of 6 characters.")

                    const encryptPassword=hashSync(password)
                    const newUser = new user({userName,emailId,password:encryptPassword})

                    await newUser.save()
                    return {...newUser.toObject(),id:newUser._id}
                } catch (error) {
                    console.log(error)
                    return new Error('User signup failed. Try again.')
                }
            }
        },
        login:{
            type:userSchemaType,
            args:{
                emailId:{type:new GraphQLNonNull(GraphQLString)},
                password:{type:new GraphQLNonNull(GraphQLString)}
            },
            async resolve(_,{emailId,password}){
                try {
                    const existingUser=await user.findOne({emailId})
                    if(!existingUser) return new Error(`User not available with this email ${emailId}`)

                    if (!password) return new Error("Password is required.")

                    const DecryptPassword=compareSync(password,existingUser.password!)
                    if(!DecryptPassword) return new Error("Wrong Password")

                    const token=jwt.sign({id:existingUser._id!},process.env.SecretKey!,{expiresIn:'7d'})
                    return {...existingUser.toObject(),id:existingUser._id,token}
                } catch (error) {
                    return new Error('User login failed. Try again.')
                }
            }
        },
        NewRideBooking:{
            type:RideBookingSchemaType,
            args:{
                userId:{type:new GraphQLNonNull(GraphQLID)},
                token:{type:new GraphQLNonNull(GraphQLString)},
                pickUpLocation:{type:new GraphQLNonNull(GraphQLString)},
                dropOffLocation:{type:new GraphQLNonNull(GraphQLString)},
                personsCount:{type:new GraphQLNonNull(GraphQLInt)},
                vehicleCategory:{type:new GraphQLNonNull(GraphQLString)},
                pickUpScheduleTime:{type:new GraphQLNonNull(GraphQLString)},
                payment:{type:new GraphQLNonNull(GraphQLString)}
            },
            async resolve(_,{userId,token,pickUpLocation,dropOffLocation,personsCount,vehicleCategory,pickUpScheduleTime,payment}){
                const session=await startSession()
                try {
                    session.startTransaction({session})
                    const existingUser=await user.findOne({_id:userId})
                    if(!existingUser) return new Error(`User not found`)
                    jwt.verify(token,process.env.SecretKey!,async (error:any,decrypt:any)=>{
                      if(error){
                        return  new Error(error.message)
                      }else{
                        const existingUser=await user.findOne({_id:decrypt.id})
                        if(!existingUser) return new Error(`Unauthorized`)
                      }
                    })

                    if (!Object.values(IVehicleCategory).includes(vehicleCategory)) return new Error(`Invalid vehicleCategory: ${vehicleCategory}`)
                    
                    let newBooking:INewBooking|any =  new rideBooking({userId,pickUpLocation,dropOffLocation,personsCount,vehicleCategory,pickUpScheduleTime,payment, Status:"Pending"})
                    existingUser.bookings!.push(newBooking)
                    await existingUser.save({session})
                    let drivers=await driver.find().populate('documents')
                    let driverId=null
                    if(drivers){
                        drivers.forEach((item)=>{
                            if(item.status && item.status==="Available"){
                                if(item.documents  && item.documents.length > 0){
                                    item.documents.forEach((items:IDriverDocument|any)=>{
                                        if(items.vehicleCategory && items.vehicleCategory===vehicleCategory){
                                            driverId=item._id
                                        }
                                    })
                                }
                            }
                        })
                    }
                    await newBooking.save({session})
                    if(driverId){
                        let SelectedDriver=await driver.findOne({_id:driverId})
                        let NewRide :any = new driverRides({driverId,userId:newBooking._id,userName:existingUser.userName,pickUpLocation,dropOffLocation,status:"Pending"})
                        SelectedDriver?.rides.push(NewRide)
                        await SelectedDriver?.save({session})
                        await NewRide.save({session})
                        WebSocketSetup.EmitMessage('New Booking for you.')
                    }
                    return newBooking
                } catch (error) {
                    return new Error('Booking failed. Try again.')
                } finally{
                    await session.commitTransaction()
                }
            }
        }
    }
})

export default new GraphQLSchema({query:UserQuery,mutation:UserMutation})


