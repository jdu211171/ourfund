import { createServer } from "node:http";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverEntryPath = resolve(__dirname, "dist/server/server.js");

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile();
}

const { default: server } = await import(serverEntryPath);

const port = Number(process.env.PORT) || 3002;

function getSetCookieHeaders(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const value = headers.get("set-cookie");
  if (!value) return [];

  return value.split(/,(?=\s*[^;,]+=)/g);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : Readable.toWeb(req);
    const requestInit = {
      method: req.method,
      headers: req.headers,
      body,
    };
    if (body) {
      requestInit.duplex = "half";
    }

    const request = new Request(url, requestInit);

    const response = await server.fetch(request, {}, {});

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") {
        res.setHeader(key, value);
      }
    });

    const setCookies = getSetCookieHeaders(response.headers);
    if (setCookies.length > 0) {
      res.setHeader("set-cookie", setCookies);
    }

    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
}).listen(port, () => {
  console.log(`ourfund server listening on http://127.0.0.1:${port}`);
});
