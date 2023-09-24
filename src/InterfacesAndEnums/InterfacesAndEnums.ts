export interface IDriverDocument {
    userid:string,
    licenseNumber:string,
    licenceImage:string,
    vehicleNumber:string,
    vehicleCategory:string
  }


export interface INewBooking{
    userId:string,
    pickUpLocation:string,
    dropOffLocation:string,
    personsCount:number,
    vehicleCategory:string,
    pickUpScheduleTime:string,
    payment:string,
    Status:string
}

export enum IDriverStatus {
    Available,
    onRide,
    Unavailable,
}

export enum IBookingStatus {
    Pending,
    Accepted,
    Cancelled,
    Completed,
}

export enum IVehicleCategory{
    SingleSeater,
    TripleSeater,
    FourSeater,
}