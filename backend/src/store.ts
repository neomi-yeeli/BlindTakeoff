import { FlightRequest, FlightRequestPayload } from "./types";
import { v4 as uuid } from "uuid";

const requests = new Map<string, FlightRequest>();

export const createRequest = (payload: FlightRequestPayload): FlightRequest => {
  const req: FlightRequest = {
    ...payload,
    id: uuid(),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  requests.set(req.id, req);
  return req;
};

export const approveRequest = (id: string) => {
  const req = requests.get(id);
  if (!req) return undefined;
  req.status = "approved";
  req.approvedAt = new Date().toISOString();
  requests.set(id, req);
  return req;
};

export const finishRequest = (
  id: string,
  payload: { finishedAt: string; durationMs: number }
) => {
  const req = requests.get(id);
  if (!req) return undefined;
  req.status = "finished";
  req.finishedAt = payload.finishedAt;
  req.durationMs = payload.durationMs;
  requests.set(id, req);
  return req;
};

export const getRequest = (id: string) => requests.get(id);


