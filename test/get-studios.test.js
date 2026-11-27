import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";

test("GET /studios", async (t) => {
  Object.assign(process.env, {
    FRONTEND_BASE_URI: "http://localhost:3000",
    MONGO_URI: "mongodb://127.0.0.1:27017",
    CLOUDINARY_CLOUD_NAME: "test",
    CLOUDINARY_API_KEY: "test",
    CLOUDINARY_API_SECRET: "test",
  });

  const { default: app } = await import("../src/app.js");
  const { studiosCollection } = await import("../src/config/db.js");

  const details = {
    category: "Podcast Studio",
    hourlyRate: 75.5,
    securityDeposit: 0,
    capacity: 4,
    location: "Downtown",
    address: "10 Main St",
    overview: "Ready to record.",
    amenities: ["Broadcast Mics"],
    availableTimeRanges: [{ startTime: "09:00", endTime: "17:00" }],
    imageUrl: "https://example.com/studio.png",
  };
  const studios = [
    { _id: "studio-a", title: "Studio A", ...details },
    { _id: "studio-b", title: "Studio B", ...details },
  ];

  const toArray = t.mock.fn(async () => studios);
  const find = t.mock.method(studiosCollection, "find", () => ({ toArray }));

  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, "listening");

  const get = () => fetch(`http://127.0.0.1:${server.address().port}/studios`);

  await t.test("lists public studio details without authentication or a creator filter", async () => {
    const response = await get();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, studios });
    assert.equal(find.mock.callCount(), 1);
    assert.deepEqual(find.mock.calls[0].arguments, [{}, {
      projection: {
        _id: 1,
        title: 1,
        category: 1,
        hourlyRate: 1,
        securityDeposit: 1,
        capacity: 1,
        location: 1,
        address: 1,
        overview: 1,
        amenities: 1,
        "availableTimeRanges.startTime": 1,
        "availableTimeRanges.endTime": 1,
        imageUrl: 1,
      },
    }]);
  });

  await t.test("returns an empty array when there are no listings", async () => {
    toArray.mock.mockImplementationOnce(async () => []);

    const response = await get();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, studios: [] });
  });

  await t.test("returns a generic error when the MongoDB query fails", async (t) => {
    t.mock.method(console, "error", () => {});
    toArray.mock.mockImplementationOnce(async () => { throw new Error("Query failed"); });

    const response = await get();
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { success: false, message: "Failed to fetch studios." });
  });
});
