import express from 'express';
import cors from 'cors';
import studioRoutes from './routes/studioRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use(studioRoutes);

export default app;
