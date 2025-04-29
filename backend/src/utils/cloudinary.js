const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Initialize Cloudinary with environment variables
// The CLOUDINARY_URL environment variable should contain the full Cloudinary URL
// with cloud name, API key, and API secret
cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image to Cloudinary
 * @param {string} base64Image - Base64 encoded image string
 * @param {string} folder - Optional folder path in Cloudinary
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Cloudinary upload response
 */
const uploadImage = async (
  base64Image,
  folder = "profile_pictures",
  options = {}
) => {
  try {
    // Remove data URL prefix if present
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, "");

    // Default transformation options based on folder type
    let transformations = [];

    if (folder === "profile_pictures") {
      transformations = [
        { width: 500, height: 500, crop: "limit" },
        { quality: "auto:good" },
      ];
    } else if (folder === "book_covers") {
      transformations = [
        { width: 800, height: 1200, crop: "limit" },
        { quality: "auto:good" },
      ];
    } else {
      transformations = [
        { width: 1000, height: 1000, crop: "limit" },
        { quality: "auto:good" },
      ];
    }

    // Merge default options with provided options
    const uploadOptions = {
      folder,
      resource_type: "image",
      transformation: transformations,
      ...options,
    };

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${imageData}`,
      uploadOptions
    );

    console.log(
      `Image uploaded to Cloudinary in ${folder}:`,
      result.secure_url
    );
    return result;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

module.exports = {
  uploadImage,
};
