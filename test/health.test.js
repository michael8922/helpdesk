import assert from "node:assert/strict";
import app from "../src/app.js";

// Mocha expone describe(), before(), after() e it() como funciones globales
// cuando ejecuta los archivos de test.
describe("GET /api/v1/health", function () {
  let server;
  let baseUrl;

  // before() se ejecuta una vez antes de los casos de este describe().
  // El callback done indica a Mocha que esta preparación es asíncrona.
  before(function (done) {
    // Puerto 0 solicita al sistema operativo un puerto libre automáticamente.
    server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  // after() libera recursos una vez terminados los tests del bloque.
  after(function (done) {
    server.close(done);
  });

  // it(descripción, test) define una expectativa concreta.
  it("returns HTTP 200 and healthy=true", async function () {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    const body = await response.json();

    // node:assert/strict viene con Node; no necesitamos Chai para este ejemplo.
    assert.equal(response.status, 200);
    assert.equal(body.status, "success");
    assert.equal(body.data.healthy, true);
  });
});
