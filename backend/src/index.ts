import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { approveRequest, createRequest, finishRequest, getRequest } from "./store";
import { FlightRequestPayload } from "./types";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/flight-requests", (req, res) => {
  const body = req.body as FlightRequestPayload;
  const required = [
    "locationName",
    "latitude",
    "longitude",
    "droneWidthCm",
    "droneLengthCm",
    "operationType"
  ];
  const missing = required.filter((k) => body[k as keyof FlightRequestPayload] === undefined);
  if (missing.length) return res.status(400).json({ message: `Missing ${missing.join(", ")}` });

  const request = createRequest(body);
  res.status(201).json(request);

  setTimeout(() => {
    const approved = approveRequest(request.id);
    if (approved) {
      io.to(request.id).emit("approval", approved);
    }
  }, 5_000);
});

app.get("/flight-requests/:id", (req, res) => {
  const request = getRequest(req.params.id);
  if (!request) return res.status(404).json({ message: "Not found" });
  return res.json(request);
});

app.post("/flight-requests/:id/finish", (req, res) => {
  const finished = finishRequest(req.params.id, req.body);
  if (!finished) return res.status(404).json({ message: "Not found" });
  io.to(req.params.id).emit("finished", finished);
  return res.json(finished);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

type PeerRole = "publisher" | "viewer";

io.on("connection", (socket) => {
  const { operationId, role } = socket.handshake.query as {
    operationId?: string;
    role?: PeerRole;
  };

  if (!operationId || !role) {
    socket.disconnect();
    return;
  }

  socket.join(operationId);

  socket.on("signal", (payload) => {
    socket.to(operationId).emit("signal", payload);
  });

  socket.on("ping-latency", (clientTimestamp?: number) => {
    const now = Date.now();
    const latency = clientTimestamp ? now - clientTimestamp : 0;
    socket.emit("pong-latency", latency);
  });

  socket.on("disconnect", () => {
    socket.leave(operationId);
  });
});

const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});


