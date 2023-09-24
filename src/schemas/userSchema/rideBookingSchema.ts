import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";

export const RideBookingSchemaType:GraphQLObjectType=new GraphQLObjectType({
    name:"RideBooking",
    fields:{
        id:{type:new GraphQLNonNull(GraphQLID)},
        userId:{type:new GraphQLNonNull(GraphQLID)},
        pickUpLocation:{type:new GraphQLNonNull(GraphQLString)},
        dropOffLocation:{type:new GraphQLNonNull(GraphQLString)},
        personsCount:{type:new GraphQLNonNull(GraphQLInt)},
        vehicleCategory:{type:new GraphQLNonNull(GraphQLString)},
        pickUpScheduleTime:{type:new GraphQLNonNull(GraphQLString)},
        payment:{type:new GraphQLNonNull(GraphQLString)},
        Status:{type:new GraphQLNonNull(GraphQLString)}
    }
})