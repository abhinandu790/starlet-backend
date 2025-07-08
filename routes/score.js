import express from "express";
import axios from "axios"; // ✅ Required
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.get("/score", async (req, res) => {
  const { query } = req.query;
  console.log("➡️ Received query:", query);

  try {
    const geo = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: { q: query, key: process.env.OPENCAGE_API_KEY }
    });

    const { lat, lng } = geo.data.results[0]?.geometry;
    console.log("📍 Lat/Lng:", lat, lng);

    const a11y = await axios.get("https://accessibility-cloud.freetls.fastly.net/place-infos", {
      params: {
        appToken: process.env.ACCESSIBILITY_CLOUD_API_KEY,
        latitude: lat,
        longitude: lng,
        radius: 1500,
        limit: 1
      }
    });

    const features = a11y.data?.features;
    if (!features || features.length === 0) {
      return res.status(404).json({ error: "No accessibility data found for this place." });
    }

    const place = features[0];
    const properties = place?.properties || {};

    const featuresToCheck = {
      "Wheelchair Accessible": properties.wheelchairAccessibleEntrance,
      "Elevator Available": properties.elevator,
      "Toilets Available": properties.toilet,
      "Braille Signage": properties.brailleSignage,
      "Audio Guidance": properties.audioSignage,
      "Tactile Ground Surface Indicators": properties.tactileGroundSurfaceIndicators,
      "Induction Loops": properties.inductionLoops,
      "Ramp": properties.hasRamp,
      "Wide Doors": properties.hasWideDoors
    };

    let total = 0;
    let accessibleCount = 0;
    const detailedScores = [];

    for (const [label, value] of Object.entries(featuresToCheck)) {
      total++;
      const accessible = value === true || value === "yes";
      if (accessible) accessibleCount++;

      detailedScores.push({
        feature: label,
        status: value ?? "unknown",
        accessible: accessible ? 100 : 0
      });
    }

    const overallScore = Math.round((accessibleCount / total) * 100);

    res.json({
      placeName: properties.name || "Unnamed Place",
      address: properties.address?.full || "Unknown Address",
      overallScore: `${overallScore}% accessible`,
      features: detailedScores
    });

  } catch (err) {
    console.error("❌ Error fetching score:", err.message);
    res.status(500).json({ error: "Failed to fetch score" });
  }
});

export default router;
