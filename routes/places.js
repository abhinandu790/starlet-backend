import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const mapAccessibility = (value) => {
  switch (value) {
    case "fully-accessible-by-wheelchair":
      return { label: "Fully Accessible", icon: "✅", color: "green" };
    case "at-least-partially-accessible-by-wheelchair":
      return { label: "Partially Accessible", icon: "♿", color: "blue" };
    case "not-accessible-by-wheelchair":
      return { label: "Not Accessible", icon: "❌", color: "red" };
    default:
      return { label: "Unknown", icon: "❓", color: "gray" };
  }
};

// ✅ Optional root route for test
router.get("/", (req, res) => {
  const query = req.query.query;
  console.log("Query received:", query);
  res.json({
    message: `Query received for ${query}`,
    results: [],
  });
});

// 🔥 /api/places - real data route
router.get("/places", async (req, res) => {
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "Location query is required." });

  try {
    // Step 1: Get coordinates from OpenCage
    const geoResponse = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        q: query,
        key: process.env.OPENCAGE_API_KEY,
      },
    });

    const { results } = geoResponse.data;
    if (!results.length || !results[0].geometry) {
      return res.status(404).json({ error: "No coordinates found for the place." });
    }

    const { lat, lng } = results[0].geometry;
    console.log("📍 Coordinates:", lat, lng);

    // Step 2: Get accessibility info from Accessibility Cloud v2
    const accessResponse = await axios.get("https://accessibility-cloud-v2.freetls.fastly.net/place-infos.json", {
      params: {
        appToken: process.env.ACCESSIBILITY_CLOUD_API_KEY, // or ACCESSIBILITY_CLOUD_TOKEN if that's correct
        latitude: lat,
        longitude: lng,
        accuracy: 1000,
        includeRelated: "source",
        limit: 15,
      },
    });

    const rawData = accessResponse.data.features || [];
    console.log("✅ Places fetched:", rawData.length);

    const formatted = rawData.map((place) => {
      const props = place.properties || {};
      const access = mapAccessibility(props.wheelchairAccessibility?.value);

      return {
        name: props.name || "Unnamed Place",
        address: props.address?.full || "Unknown address",
        category: props.category || "General",
        wheelchairAccessibility: access.label,
        accessibilityIcon: access.icon,
        color: access.color,
        geometry: place.geometry,
      };
    });

    res.json({
      coordinates: { lat, lng },
      results: formatted,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: "Failed to fetch place data." });
  }
});

console.log("✅ places.js loaded");
export default router;
