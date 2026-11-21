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
const studioSpace = await mongoClient.db("studio_space");
const studiosCollections = await mongoClient.db("studios");
const studioBookingCollections = await mongoClient.db("studio_bookings");


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});