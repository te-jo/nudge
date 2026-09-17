import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { tagsRouter } from "./routes/tags";
import { tasksRouter } from "./routes/tasks";
import { eventsRouter } from "./routes/events";
import { HttpError } from "./lib/http-error";

const app = express();

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/tags", tagsRouter);
app.use("/tasks", tasksRouter);
app.use("/events", eventsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`api listening on :${port}`);
});
