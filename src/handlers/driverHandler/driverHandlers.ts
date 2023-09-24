import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { driverSchemaType } from "../../schemas/driverSchema/driverSchema";
import driver from '../../models/driverModels/driverModel'
import driverDocuments from '../../models/driverModels/driverDocumentsModel'
import { compareSync, hashSync } from "bcryptjs";
import jwt from 'jsonwebtoken'
import { driverDocumentsSchemaType } from "../../schemas/driverSchema/driverDocumentsSchema";
import { Document, startSession } from "mongoose";
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
                licenceNumber: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(parent, { userName, emailId, password, licenceNumber }) {
                try {
                    const existingUser = await driver.findOne({ emailId })
                    if (existingUser) return new Error('User already exists with this email')
                    const encryptPassword = hashSync(password)
                    const newDriver = new driver({ userName, emailId, password: encryptPassword, licenceNumber })
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
            async resolve(parent, { emailId, password }) {
                try {
                    const existingUser = await driver.findOne({ emailId })
                    if (!existingUser) return new Error('User notfound')
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
            async resolve(parent, { userid, licenceNumber, licenceImage, vehicleNumber, vehicleCategory }) {
                let newDocument: Document<any, any, any> | any
                const session = await startSession()
                try {
                    session.startTransaction({ session })
                    const existingUser = await driver.findOne({ _id: userid })
                    if (!existingUser) return new Error(`user not found`)
                    newDocument = new driverDocuments({ userid, licenceNumber, licenceImage, vehicleNumber, vehicleCategory })
                    existingUser.documents.push(newDocument)
                    await existingUser.save({ session })
                    return await newDocument.save({ session })
                } catch (error) {
                    console.log(error)
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
            async resolve(parent, { id, userId }) {
                const session = await startSession()
                try {
                    session.startTransaction({ session })
                    const existingUser = await driver.findOne({ _id: userId })
                    if (!existingUser) return new Error(`user not found`)

                    const deleteDocument = await driverDocuments.findByIdAndDelete(id)
                    if (!deleteDocument) return new Error('Failed to delete document')
                    existingUser.documents = existingUser.documents.filter(
                        docId => docId.toString() !== id.toString()
                    )
                    await existingUser.save({ session })
                    return deleteDocument
                } catch (error) {
                    console.log(error)
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
            async resolve(parent,{id,status}){
                const StatusUpdated=await driver.findByIdAndUpdate(id,{status},{new:true})
                if(!StatusUpdated) return new Error("Unable to Update status")
                return StatusUpdated
            }
        }

    }
})

export default new GraphQLSchema({ query: driverQuery, mutation: driverMutation })