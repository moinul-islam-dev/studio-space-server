import 'dotenv/config'
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI);
const studioSpaceDB = await mongoClient.db("studio_space");
const studiosCollection = await studioSpaceDB.collection("studios");
const studioBookingCollection = await studioSpaceDB.collection("studio_bookings");


export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}
