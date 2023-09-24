import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { RideBookingSchemaType } from "./rideBookingSchema";
import rideBooking from '../../models/userModels/rideBookingModel'
export const userSchemaType:GraphQLObjectType=new GraphQLObjectType({
    name:"userSchemaType",
    fields:()=>({
        id:{type: new GraphQLNonNull(GraphQLID)},
        userName:{type:new GraphQLNonNull(GraphQLString)},
        emailId:{type:new GraphQLNonNull(GraphQLString)},
        password:{type:new GraphQLNonNull(GraphQLString)},
        token:{type:GraphQLString},
        bookings:{type:new GraphQLList(RideBookingSchemaType),async resolve(parent){
            return await rideBooking.find({userId:parent.id})
        }}
    })
})
