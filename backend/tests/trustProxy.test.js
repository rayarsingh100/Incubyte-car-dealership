const { configureTrustProxy, parseTrustProxyHops } = require("../src/config/trustProxy");

test("does not trust proxy headers by default", () => {
  const app = { set: jest.fn() };

  expect(configureTrustProxy(app, undefined)).toBeUndefined();
  expect(app.set).not.toHaveBeenCalled();
});

test("accepts only a bounded explicit proxy-hop count", () => {
  const app = { set: jest.fn() };

  expect(configureTrustProxy(app, "2")).toBe(2);
  expect(app.set).toHaveBeenCalledWith("trust proxy", 2);
  expect(parseTrustProxyHops("5")).toBe(5);
});

test.each(["true", "*", "0", "6", "1,2", "-1"])('rejects unsafe proxy trust setting "%s"', (value) => {
  expect(() => parseTrustProxyHops(value)).toThrow("TRUST_PROXY_HOPS must be an integer from 1 through 5");
});
