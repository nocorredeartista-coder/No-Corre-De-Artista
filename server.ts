import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
