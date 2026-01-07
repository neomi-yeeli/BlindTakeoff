export type OperationType = "takeoff" | "landing";

export type FlightRequestPayload = {
  locationName: string;
  latitude: number;
  longitude: number;
  droneWidthCm: number;
  droneLengthCm: number;
  operationType: OperationType;
};

export type FlightRequest = FlightRequestPayload & {
  id: string;
  status: "pending" | "approved" | "finished";
  createdAt: string;
  approvedAt?: string;
  finishedAt?: string;
  durationMs?: number;
};


