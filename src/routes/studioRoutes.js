import express from "express";
import { addStudio, getStudios } from "../controllers/studioController.js";
import upload from "../middlewares/upload.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();
const uploadImage = upload.single("image");

function parseStudioImage(req, res, next) {
  uploadImage(req, res, (error) => {
    if (!error) return next();

    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    return res.status(tooLarge ? 413 : 400).json({
      success: false,
      message: tooLarge
        ? "Studio image must be 5 MB or smaller."
        : 'Send one JPG, PNG, or WEBP file in the "image" field.',
    });
  });
}

router.get("/studios", getStudios);
router.post("/add-studio", verifyToken, parseStudioImage, addStudio);

export default router;
