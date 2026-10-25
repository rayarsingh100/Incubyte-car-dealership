const MIN_TRUST_PROXY_HOPS = 1;
const MAX_TRUST_PROXY_HOPS = 5;

function parseTrustProxyHops(value) {
  if (value === undefined || value === "") return undefined;
  if (!/^[1-5]$/.test(value)) {
    throw new Error("TRUST_PROXY_HOPS must be an integer from 1 through 5 when configured.");
  }
  const hops = Number(value);
  if (hops < MIN_TRUST_PROXY_HOPS || hops > MAX_TRUST_PROXY_HOPS) {
    throw new Error("TRUST_PROXY_HOPS must be an integer from 1 through 5 when configured.");
  }
  return hops;
}

function configureTrustProxy(app, value = process.env.TRUST_PROXY_HOPS) {
  const hops = parseTrustProxyHops(value);
  if (hops !== undefined) app.set("trust proxy", hops);
  return hops;
}

module.exports = { configureTrustProxy, parseTrustProxyHops };
