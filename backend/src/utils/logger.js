const ts = () => new Date().toISOString();

function format(level, args) {
  const reqId = typeof args[0] === "object" && args[0]?.reqId ? `[req=${args[0].reqId}] ` : "";
  const rest = reqId ? args.slice(1) : args;
  return [`[${ts()}] [${level}]`, reqId.trim(), ...rest].filter(Boolean);
}

export const logger = {
  info: (...a) => console.log(...format("INFO", a)),
  warn: (...a) => console.warn(...format("WARN", a)),
  error: (...a) => console.error(...format("ERROR", a)),
  debug: (...a) => {
    if (process.env.NODE_ENV !== "production") console.debug(...format("DEBUG", a));
  },
  child: (ctx) => ({
    info: (...a) => console.log(...format("INFO", [{ reqId: ctx.reqId }, ...a])),
    warn: (...a) => console.warn(...format("WARN", [{ reqId: ctx.reqId }, ...a])),
    error: (...a) => console.error(...format("ERROR", [{ reqId: ctx.reqId }, ...a])),
  }),
};
