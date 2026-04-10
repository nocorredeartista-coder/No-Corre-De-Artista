import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import { Client } from "@googlemaps/google-maps-services-js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const googleMapsClient = new Client({});

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json());

  // Mock Driver State
  let driverLocation = { lat: -23.5505, lng: -46.6333 }; // São Paulo center
  const carModel = "Hyundai HB20 - Cinza";
  const plate = "Enviada via chat";
  const driverName = "Juan";

  // Simulate Driver Movement
  setInterval(() => {
    driverLocation.lat += (Math.random() - 0.5) * 0.001;
    driverLocation.lng += (Math.random() - 0.5) * 0.001;
    io.emit("driver:location", { 
      location: driverLocation,
      car: carModel,
      plate: plate,
      driverName: driverName,
      timestamp: new Date().toISOString()
    });
  }, 3000);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    // Send initial location
    socket.emit("driver:location", { 
      location: driverLocation,
      car: carModel,
      plate: plate,
      driverName: driverName,
      timestamp: new Date().toISOString()
    });
  });

  // API Route to calculate distance and time using Google Maps
  app.post("/api/calculate-distance", async (req, res) => {
    const { origin, destination } = req.body;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY") {
      console.warn("GOOGLE_MAPS_API_KEY is not set or using placeholder. Using fallback simulation.");
      // Fallback simulation if no API key
      const mockDistance = Math.random() * 13 + 2;
      return res.json({ 
        distanceKm: mockDistance, 
        durationText: `${Math.round(mockDistance * 2.5 + 5)} min`,
        isSimulated: true 
      });
    }

    try {
      const response = await googleMapsClient.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination],
          key: apiKey,
          mode: "driving" as any,
          units: "metric" as any,
        },
        timeout: 5000,
      });

      const element = response.data.rows[0].elements[0];

      if (element.status === "OK") {
        const distanceKm = element.distance.value / 1000;
        const durationText = element.duration.text;
        res.json({ distanceKm, durationText, isSimulated: false });
      } else {
        throw new Error(`Google Maps Error: ${element.status}`);
      }
    } catch (error: any) {
      console.error("Error calculating distance:", error);
      // Fallback on error
      const mockDistance = Math.random() * 13 + 2;
      res.json({ 
        distanceKm: mockDistance, 
        durationText: `${Math.round(mockDistance * 2.5 + 5)} min`,
        isSimulated: true,
        error: error.message 
      });
    }
  });

  // API Route for Reverse Geocoding
  app.post("/api/reverse-geocode", async (req, res) => {
    const { lat, lng } = req.body;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY") {
      return res.json({ address: `${lat},${lng}`, warning: "Google Maps API key not configured" });
    }

    try {
      const response = await googleMapsClient.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: apiKey
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        res.json({ address: response.data.results[0].formatted_address });
      } else {
        res.json({ address: `${lat},${lng}` });
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
      res.json({ address: `${lat},${lng}` });
    }
  });

  // Lazy initialization of Stripe
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        console.warn("STRIPE_SECRET_KEY is not set. Payments will not work.");
        return null;
      }
      stripe = new Stripe(key);
    }
    return stripe;
  };

  // API Route to create a Payment Intent
  app.post("/api/create-payment-intent", async (req, res) => {
    const { amount, currency = "brl" } = req.body;

    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured." });
    }

    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects amount in cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
