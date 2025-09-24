// T030: Minimal structured logger (can be expanded or swapped later)
interface LogFields {
  [k: string]: any;
}
function fmt(level: string, msg: string, fields?: LogFields) {
  const base: any = { ts: new Date().toISOString(), level, msg };
  if (fields) Object.assign(base, fields);
  return JSON.stringify(base);
}
export const log = {
  debug: (msg: string, fields?: LogFields) =>
    process.stdout.write(fmt("debug", msg, fields) + "\n"),
  info: (msg: string, fields?: LogFields) =>
    process.stdout.write(fmt("info", msg, fields) + "\n"),
  warn: (msg: string, fields?: LogFields) =>
    process.stdout.write(fmt("warn", msg, fields) + "\n"),
  error: (msg: string, fields?: LogFields) =>
    process.stderr.write(fmt("error", msg, fields) + "\n"),
};
