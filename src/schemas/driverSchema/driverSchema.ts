import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { driverDocumentsSchemaType } from "./driverDocumentsSchema";
import driverDocuments from '../../models/driverModels/driverDocumentsModel'
import driverRides from '../../models/driverModels/driverRidesModel'
import { driverRidesSchemaType } from "./driverRidesSchema";
export const driverSchemaType:GraphQLObjectType=new GraphQLObjectType({
    name:"driverSchemaType",
    fields:()=>({
        id:{type: new GraphQLNonNull(GraphQLID)},
        userName:{type:new GraphQLNonNull(GraphQLString)},
        emailId:{type:new GraphQLNonNull(GraphQLString)},
        password:{type:new GraphQLNonNull(GraphQLString)},
        licenseNumber:{type:new GraphQLNonNull(GraphQLString)},
        token:{type:GraphQLString},
        status:{type:GraphQLString},
        documents:{type:new GraphQLList(driverDocumentsSchemaType),async resolve(parent){
            return await driverDocuments.find({userid:parent.id})
        }},
        rides:{type:new GraphQLList(driverRidesSchemaType),async resolve(parent){
            return await driverRides.find({driverId:parent.id})
        }}
    })
})
