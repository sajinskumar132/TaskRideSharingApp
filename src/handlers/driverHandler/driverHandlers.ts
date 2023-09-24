import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { driverSchemaType } from "../../schemas/driverSchema/driverSchema";
import driver from '../../models/driverModels/driverModel'
import driverDocuments from '../../models/driverModels/driverDocumentsModel'
import { compareSync, hashSync } from "bcryptjs";
import jwt from 'jsonwebtoken'
import { driverDocumentsSchemaType } from "../../schemas/driverSchema/driverDocumentsSchema";
import { Document, startSession } from "mongoose";
import { driverRidesSchemaType } from "../../schemas/driverSchema/driverRidesSchema";
import driverRides from '../../models/driverModels/driverRidesModel'
import rideBooking from '../../models/userModels/rideBookingModel'
import WebSocketSetup from "../../services/webSocketServices";
import { IBookingStatus, IDriverDocument, IDriverStatus, IVehicleCategory } from "../../InterfacesAndEnums/InterfacesAndEnums";
const driverQuery = new GraphQLObjectType({
    name: "driverQuery",
    fields: {
        getAllDrivers: {
            type: new GraphQLList(driverSchemaType),
            async resolve() {
                return await driver.find()
            }
        }
    }
})

const driverMutation = new GraphQLObjectType({
    name: "driverMutation",
    fields: {
        signup: {
            type: driverSchemaType,
            args: {
                userName: { type: new GraphQLNonNull(GraphQLString) },
                emailId: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) },
                licenseNumber: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_,{ userName, emailId, password, licenseNumber }) {
                try {
                    const existingUser = await driver.findOne({ emailId })
                    if (existingUser) return new Error('User already exists with this email')
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
                    if (!licenseNumber) {
                        errors.push("licenseNumber is required.");
                      }
                    if (errors.length > 0) return new Error(errors.toString())
                    if(password.length<5) return new Error("The password length should be a minimum of 5 characters.")
                    const encryptPassword = hashSync(password)
                    const newDriver = new driver({ userName, emailId, password: encryptPassword, licenseNumber })
                    return await newDriver.save()
                } catch (error) {
                    return new Error('SignUp failed')
                }
            }
        },
        login: {
            type: driverSchemaType,
            args: {
                emailId: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, { emailId, password }) {
                try {
                    const existingUser = await driver.findOne({ emailId })
                    if (!existingUser) return new Error(`User not available with this email ${emailId}`)

                    if (!password) return new Error("Password is required.")

                    const DecryptPassword = compareSync(password, existingUser.password!)
                    if (!DecryptPassword) return new Error("Wrong Password")

                    const token = jwt.sign({ id: existingUser._id! }, process.env.SecretKey!, { expiresIn: '7d' })
                    await driver.findByIdAndUpdate(existingUser._id,{status:'Unavailable' },{new:true})

                    return { ...existingUser.toObject(), id: existingUser._id, token,status:'Unavailable'}
                } catch (error) {
                    return new Error("Login failed")
                }
            }
        },
        addDocuments: {
            type: driverDocumentsSchemaType,
            args: {
                userid: { type: new GraphQLNonNull(GraphQLID) },
                licenceNumber: { type: new GraphQLNonNull(GraphQLString) },
                licenceImage: { type: new GraphQLNonNull(GraphQLString) },
                vehicleNumber: { type: new GraphQLNonNull(GraphQLString) },
                vehicleCategory: { type: new GraphQLNonNull(GraphQLString) }
            },
            async resolve(_, { userid, licenceNumber, licenceImage, vehicleNumber, vehicleCategory }) {
                const session = await startSession()
                try {
                    session.startTransaction({ session })
                    if (!Object.values(IVehicleCategory).includes(vehicleCategory)) return new Error(`Invalid vehicleCategory: ${vehicleCategory}`)

                    const existingUser = await driver.findOne({ _id: userid })
                    if (!existingUser) return new Error(`User not found`)
                    
                    let newDocument:IDriverDocument|any = new driverDocuments({ userid, licenceNumber, licenceImage, vehicleNumber, vehicleCategory })
                    existingUser.documents.push(newDocument)
                    await existingUser.save({ session })
                    return await newDocument.save({ session })
                } catch (error) {
                    return new Error("Failed to add document")
                } finally {
                    await session.commitTransaction()
                }

            }
        },
        deleteDocument: {
            type: driverDocumentsSchemaType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                userId: { type: new GraphQLNonNull(GraphQLID) }
            },
            async resolve(_, { id, userId }) {
                const session = await startSession()
                try {
                    session.startTransaction({ session })
                    const existingUser = await driver.findOne({ _id: userId })
                    if (!existingUser) return new Error(`User not found`)

                    const deleteDocument = await driverDocuments.findByIdAndDelete(id)
                    if (!deleteDocument) return new Error('Document not found')

                    existingUser.documents = existingUser.documents.filter(
                        docId => docId.toString() !== id.toString()
                    )
                    await existingUser.save({ session })
                    return deleteDocument
                } catch (error) {
                    return new Error('Failed to delete document')
                } finally {
                    await session.commitTransaction()
                }
            }
        },
        UpdateStatus:{
            type: driverSchemaType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                status:{type:new GraphQLNonNull(GraphQLString)}
            },
            async resolve(_,{id,status}){
                try {
                    if (!Object.values(IDriverStatus).includes(status)) return new Error(`Invalid status: ${status}`)
                    const StatusUpdated=await driver.findByIdAndUpdate(id,{status},{new:true})
                    if(!StatusUpdated) return new Error("Failed to find the driver")
                    return StatusUpdated
                } catch (error) {
                    return new Error("Unable to Update status")
                }
                
            }
        },
        UpdateRides:{
            type:driverRidesSchemaType,
            args:{
                id:{ type: new GraphQLNonNull(GraphQLID) },
                UserBookid:{type:new GraphQLNonNull(GraphQLID)},
                status:{type:new GraphQLNonNull(GraphQLString)}
            },
            async resolve(_,{id,UserBookid,status}){
                try {
                    if (!Object.values(IBookingStatus).includes(status)) return new Error(`Invalid status: ${status}`)

                    const UpdatedRideStatus=await driverRides.findByIdAndUpdate(id,{status},{new:true})
                    if(!UpdatedRideStatus)  return new Error(`Ride not found`)

                    const UpdateBookedRideStatus=await rideBooking.findByIdAndUpdate(UserBookid,{Status:status},{new:true})
                    if(!UpdateBookedRideStatus) return new Error(`Booking not found`)

                    WebSocketSetup.EmitMessage('Booking Status Updated')
                    return UpdatedRideStatus
                } catch (error) {
                    return new Error("Unable to Update status")
                }
            }
        }
    }
})

export default new GraphQLSchema({ query: driverQuery, mutation: driverMutation })