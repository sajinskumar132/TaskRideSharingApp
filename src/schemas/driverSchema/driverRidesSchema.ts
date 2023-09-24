import { GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
export const driverRidesSchemaType:GraphQLObjectType=new GraphQLObjectType({
    name:"driverRidesSchemaType",
    fields:()=>({
        id:{type: new GraphQLNonNull(GraphQLID)},
        driverId:{type: new GraphQLNonNull(GraphQLID)},
        userName:{type:new GraphQLNonNull(GraphQLString)},
        pickUpLocation:{type:new GraphQLNonNull(GraphQLString)},
        dropOffLocation:{type:new GraphQLNonNull(GraphQLString)},
        Status:{type:new GraphQLNonNull(GraphQLString)}
    })
})
