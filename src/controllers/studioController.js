import cloudinary from "../config/cloudinary.js";
import { studiosCollection } from "../config/db.js";
import { validateStudioInput } from "../validators/studioValidator.js";

function uploadStudioImage(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "studiospace/studios", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.once("error", reject);
    stream.end(buffer);
  });
}

export async function addStudio(req, res) {
  const userId = req.user?.sub;

  if (typeof userId !== "string" || !userId.trim()) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  if (!req.file?.buffer?.length) {
    return res.status(400).json({
      success: false,
      message: "Studio image is required.",
    });
  }

  const { data, error: validationError } = validateStudioInput(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  let uploadedPublicId;
  let studio;

  try {
    const { secure_url: imageUrl, public_id: publicId } = await uploadStudioImage(
      req.file.buffer
    );
    uploadedPublicId = publicId;

    if (!imageUrl || !publicId) {
      throw new Error("Cloudinary did not return image details.");
    }

    const now = new Date();
    const studioData = {
      ...data,
      imageUrl,
      publicId,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } = await studiosCollection.insertOne(studioData);
    studio = { ...studioData, _id: insertedId };
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError);
      }
    }

    console.error("Add studio error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create studio.",
    });
  }

  return res.status(201).json({
    success: true,
    message: "Studio created successfully.",
    studio,
  });
}

export async function getStudios(_req, res) {
  try {
    const studios = await studiosCollection.find({}, {
      projection: {
        _id: 1,
        title: 1,
        category: 1,
        hourlyRate: 1,
        securityDeposit: 1,
        capacity: 1,
        location: 1,
        address: 1,
        overview: 1,
        amenities: 1,
        "availableTimeRanges.startTime": 1,
        "availableTimeRanges.endTime": 1,
        imageUrl: 1,
      },
    }).toArray();

    return res.status(200).json({ success: true, studios });
  } catch (error) {
    console.error("Get studios error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch studios.",
    });
  }
}
