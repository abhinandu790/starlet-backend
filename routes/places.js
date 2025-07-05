import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.get("/places", async (req, res) => {
  const { query } = req.query; // example: "Kochi, India"

  if (!query) return res.status(400).json({ error: "Location query is required." });

  try {
    // Step 1: Get lat/lon from OpenCage
    const geoResponse = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        q: query,
        key: process.env.OPENCAGE_API_KEY,
      }
    });

    const { results } = geoResponse.data;
    if (results.length === 0) {
      return res.status(404).json({ error: "No coordinates found for the place." });
    }

    const { lat, lng } = results[0].geometry;

    // Step 2: Use coordinates to query Accessibility Cloud
    const accessResponse = await axios.get("https://accessibility-cloud-v2.freetls.fastly.net/place-infos.json", {
      params: {
        appToken: process.env.ACCESSIBILITY_CLOUD_TOKEN,
        latitude: lat,
        longitude: lng,
        accuracy: 1000,
        includeRelated: "source"
      }
    });

    const features = accessResponse.data.features.map((place) => {
      const props = place.properties;
      return {
        name: props.name || "Unnamed",
        address: props.address || "Unknown address",
        category: props.category,
        wheelchairAccessible: props.accessibility?.accessibleWith?.wheelchair ?? false,
        geometry: place.geometry,
      };
    });

    res.json({ coordinates: { lat, lng }, results: features });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch place data." });
  }
});

export default router;
