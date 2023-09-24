import { GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";

export const driverDocumentsSchemaType:GraphQLObjectType=new GraphQLObjectType({
    name:"driverDocumentsSchemaType",
    fields:()=>({
        id:{type: new GraphQLNonNull(GraphQLID)},
        userid:{type: new GraphQLNonNull(GraphQLID)},
        licenseNumber:{type:new GraphQLNonNull(GraphQLString)},
        licenceImage:{type:new GraphQLNonNull(GraphQLString)},
        vehicleNumber:{type:new GraphQLNonNull(GraphQLString)},
        vehicleCategory:{type:new GraphQLNonNull(GraphQLString)}
    })
})
