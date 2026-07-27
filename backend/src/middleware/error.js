export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (req, res) =>
  res.status(404).json({ ok: false, error: "Not found", path: req.path, requestId: req.id });

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(`[req=${req.id}]`, err);
  }
  res.status(status).json({
    ok: false,
    error: err.message || "Server error",
    details: err.details,
    requestId: req.id,
  });
};
