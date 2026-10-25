function loadServer(port) {
  const previousPort = process.env.PORT;
  const previousJwtSecret = process.env.JWT_SECRET;
  const listen = jest.fn();

  if (port === undefined) delete process.env.PORT;
  else process.env.PORT = port;
  process.env.JWT_SECRET = "test-only-jwt-secret-that-is-at-least-32-characters";
  jest.doMock("dotenv", () => ({ config: jest.fn() }));
  jest.doMock("../src/app", () => ({ listen }));

  try {
    jest.isolateModules(() => {
      require("../src/server");
    });

    return listen.mock.calls[0];
  } finally {
    jest.dontMock("dotenv");
    jest.dontMock("../src/app");
    if (previousPort === undefined) delete process.env.PORT;
    else process.env.PORT = previousPort;
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  }
}

test("binds to all IPv4 interfaces on the configured port", () => {
  const [port, host, callback] = loadServer("4321");

  expect(port).toBe("4321");
  expect(host).toBe("0.0.0.0");
  expect(callback).toEqual(expect.any(Function));
});

test("keeps port 3000 as the local default when PORT is unset", () => {
  const [port, host, callback] = loadServer(undefined);

  expect(port).toBe(3000);
  expect(host).toBe("0.0.0.0");
  expect(callback).toEqual(expect.any(Function));
});
