import { GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { userSchemaType } from "../../schemas/userSchema/userSchema";
import user from '../../models/userModels/userModel'
import driver from '../../models/driverModels/driverModel'
import rideBooking from '../../models/userModels/rideBookingModel'
import {compareSync, hashSync} from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { RideBookingSchemaType } from "../../schemas/userSchema/rideBookingSchema";
import {Document, startSession} from "mongoose"
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
            async resolve(parent,{id}){
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
            async resolve(parent,{userName,emailId,password}){
                try {
                    let existingUser=await user.findOne({emailId})
                    if(existingUser) return new Error("User already exists")
                    if(!userName && !emailId && !password) return new Error("credentils is required")
                    if(password.length<5) return new Error("Password length should be 5")
                    const encryptPassword=hashSync(password)
                    const newUser = new user({userName,emailId,password:encryptPassword})
                    await newUser.save()
                    return {...newUser.toObject(),id:newUser._id}
                } catch (error) {
                    console.log(error)
                    return new Error('User signup failed.Try again')
                }
            }
        },
        loginIn:{
            type:userSchemaType,
            args:{
                emailId:{type:new GraphQLNonNull(GraphQLString)},
                password:{type:new GraphQLNonNull(GraphQLString)}
            },
            async resolve(parent,{emailId,password}){
                try {
                    const existingUser=await user.findOne({emailId})
                    if(!existingUser) return new Error(`User not awailable with this email ${emailId}`)
                    const DecryptPassword=compareSync(password,existingUser.password!)
                    if(!DecryptPassword) return new Error("Wrong Password")
                    const token=jwt.sign({id:existingUser._id!},process.env.SecretKey!,{expiresIn:'7d'})
                    return {...existingUser.toObject(),id:existingUser._id,token}
                } catch (error) {
                    console.log(error)
                    return new Error('User login failed.Try again')
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
            async resolve(parent,{userId,token,pickUpLocation,dropOffLocation,personsCount,vehicleCategory,pickUpScheduleTime,payment}){
                let newBooking:Document<any,any,any>|any
                const session=await startSession()
                try {
                    session.startTransaction({session})
                    const existingUser=await user.findOne({_id:userId})
                    if(!existingUser) return new Error(`user not found`)
                    jwt.verify(token,process.env.SecretKey!,async (error:any,decrypt:any)=>{
                      if(error){
                        return  new Error(error.message)
                      }else{
                        const existingUser=await user.findOne({_id:decrypt.id})
                        if(!existingUser) return new Error(`Un authorized`)
                      }
                    })
                    newBooking =  new rideBooking({userId,pickUpLocation,dropOffLocation,personsCount,vehicleCategory,pickUpScheduleTime,payment, Status:"Pending"})
                    existingUser.bookings!.push(newBooking)
                    await existingUser.save({session})
                    let drivers=await driver.find()
                    console.log(drivers)
                    return await newBooking.save({session})
                } catch (error) {
                    console.log(error)
                } finally{
                    await session.commitTransaction()
                }
            }
        },
        UpdateRideStatus:{
            type:RideBookingSchemaType,
            args:{
                id:{type:new GraphQLNonNull(GraphQLID)},
                Status:{type:new GraphQLNonNull(GraphQLString)},
            },
            async resolve(parent,{id,Status}){
                const session=await startSession()
                try {
                    session.startTransaction({session})
                    const existngBooking=await rideBooking.findById(id)
                    if(!existngBooking) return new Error("booking not found")
                    return await rideBooking.findByIdAndUpdate(id,{Status},{new:true})
                } catch (error) {
                   console.log(error)
                }
            }
        }
    }
})

export default new GraphQLSchema({query:UserQuery,mutation:UserMutation})


