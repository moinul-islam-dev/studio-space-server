// import 'dotenv/config'
import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient(process.env.MONGO_URI);

const studioSpaceDB = await mongoClient.db("studio_space");

export const studiosCollection = await studioSpaceDB.collection("studios");
export const studioBookingCollection = await studioSpaceDB.collection("studio_bookings");


export async function connectToMongoDB() {
  try {
    await mongoClient.connect();
    
    console.log("You successfully connected to MongoDB!");
    
    return mongoClient;
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}


