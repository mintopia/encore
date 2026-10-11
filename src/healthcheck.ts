// Docker HEALTHCHECK: connect to the port the Proxy actually binds (Config File + ENCORE_PORT).
import { createConnection } from "node:net";
import { loadConfig } from "./config.js";
import { effectiveListen } from "./proxy.js";

const { host, port } = effectiveListen(loadConfig(process.argv[2]).proxy.listen);
const target = host === "0.0.0.0" || host === "::" ? "127.0.0.1" : host;
createConnection({ host: target, port }, () => process.exit(0)).on("error", () => process.exit(1));
setTimeout(() => process.exit(1), 4000).unref();
