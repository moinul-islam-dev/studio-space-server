// import express from 'express';
// import cors from 'cors';
// import 'dotenv/config'
// import { MongoClient } from 'mongodb';

// // multer and cloudinary
// import multer from "multer";
// import cloudinary from "./src/config/cloudinary.js";



// const app = express();
// const port = process.env.PORT || 5000;
// const client = new MongoClient(process.env.MONGO_URI);

// // app.use()-এর আগে Multer configuration লিখবে
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024,
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

//     if (!allowedTypes.includes(file.mimetype)) {
//       return cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
//     }

//     cb(null, true);
//   },
// });

// app.use(cors());
// app.use(express.json());

// export async function connectToMongoDB() {
//   try {
//     await client.connect();
//     console.log("You successfully connected to MongoDB!");
//     return client;
//   } catch (err) {
//     console.dir(err);
//   }
// }

// const mongoClient = await connectToMongoDB();
// const studioSpace = await mongoClient.db("studio_space");
// const studiosCollection = await studioSpace.collection("studios");
// const studioBookingCollection = await studioSpace.collection("studio_bookings");




// const STUDIO_CATEGORIES = [
//   "Podcast Studio",
//   "Video & Film Set",
//   "Photography & Cyclorama",
//   "Music & Audio Recording",
//   "Live Streaming Suite",
//   "Creative Multipurpose Loft",
// ];

// const AMENITY_OPTIONS = [
//   "High-Speed Wi-Fi",
//   "Acoustic Treatment",
//   "Studio Lighting Kit",
//   "Broadcast Mics",
//   "4K Camera Rig",
//   "Air Conditioning",
//   "Green Room / Makeup",
//   "Free Parking",
//   "Coffee & Lounge",
// ];


// app.get('/', (req, res) => {
//   res.send('Hello, Dear Users!');
// });


// app.post("/", (req, res) => {

//   try {
//     const studioData = req.body;

//     if(!studioData || Object.keys(studioData).length === 0) {
//       return res
//         .status(400)
//         .send({
//           error: "Request body cannot be empty.",
//         })
//     }

//     res.status(201).send({
//       message: 'Resource created successfully',
//       data: data
//     });
//   }

//   catch(error) {
//     console.error('Error processing POST request:', error);
//     res.status(500).send({ error: 'Internal server error' });
//   }

// })



// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });
