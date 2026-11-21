import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import { MongoClient } from 'mongodb';



const app = express();
const port = 3000;
const client = new MongoClient(process.env.MONGO_URI);


app.use(cors());
app.use(express.json());

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();
const studioSpace =  mongoClient.db("studio_space");
const studiosCollection =  studioSpace.collection("studios");
const studioBookingCollection =  studioSpace.collection("studio_bookings");


app.get('/', (req, res) => {
  res.send('Hello, Dear Users!');
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});