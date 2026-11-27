import assert from "node:assert/strict";
import { once } from "node:events";
import { Writable } from "node:stream";
import { test } from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

const amenities = ["High-Speed Wi-Fi", "Broadcast Mics"];
const availableTimeRanges = [{ startTime: "09:00", endTime: "17:00" }];
const image = new Blob(["studio image"], { type: "image/png" });

function studioForm(overrides = {}, file = image) {
  const form = new FormData();
  const fields = {
    title: " Studio A ",
    category: "Podcast Studio",
    hourlyRate: "75.50",
    securityDeposit: "0",
    capacity: "4",
    location: " Downtown ",
    address: " 10 Main St ",
    overview: " Ready to record. ",
    amenities: JSON.stringify(amenities),
    availableTimeRanges: JSON.stringify(availableTimeRanges),
    ...overrides,
  };

  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  if (file) form.set("image", file, "studio.png");
  return form;
}

test("POST /add-studio", async (t) => {
  const issuer = "http://localhost:3000";
  Object.assign(process.env, {
    BETTER_AUTH_URL: issuer,
    MONGO_URI: "mongodb://127.0.0.1:27017",
    CLOUDINARY_CLOUD_NAME: "test",
    CLOUDINARY_API_KEY: "test",
    CLOUDINARY_API_SECRET: "test",
  });

  const { default: app } = await import("../src/app.js");
  const { default: cloudinary } = await import("../src/config/cloudinary.js");
  const { studiosCollection } = await import("../src/config/db.js");

  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256" })
    .setIssuer(issuer)
    .setAudience(issuer)
    .setSubject("studio-owner")
    .setExpirationTime("5m")
    .sign(privateKey);

  const request = globalThis.fetch;
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, `${issuer}/api/auth/jwks`);
    return Response.json({ keys: [jwk] });
  });

  const uploadedImage = {
    secure_url: "https://example.com/studio.png",
    public_id: "studiospace/studios/studio",
  };
  const upload = t.mock.method(cloudinary.uploader, "upload_stream", (_options, callback) =>
    new Writable({
      write(_chunk, _encoding, next) { next(); },
      final(next) {
        callback(null, uploadedImage);
        next();
      },
    })
  );
  const insert = t.mock.method(studiosCollection, "insertOne", async () => ({ insertedId: "studio-id" }));
  const destroy = t.mock.method(cloudinary.uploader, "destroy", async () => ({ result: "ok" }));

  t.beforeEach(() => {
    for (const method of [upload, insert, destroy]) method.mock.resetCalls();
  });

  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, "listening");

  const post = (form, bearer = token) => request(`http://127.0.0.1:${server.address().port}/add-studio`, {
    method: "POST",
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
    body: form,
  });
  const unsupportedImage = new Blob(["text"], { type: "text/plain" });

  await t.test("requires authentication before processing the image", async () => {
    const response = await post(studioForm({}, unsupportedImage), null);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).success, false);
    assert.equal(upload.mock.callCount(), 0);
  });

  await t.test("rejects missing, unsupported, or oversized images", async () => {
    const oversizedImage = new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: "image/png" });
    for (const [file, status] of [[null, 400], [unsupportedImage, 400], [oversizedImage, 413]]) {
      const response = await post(studioForm({}, file));
      assert.equal(response.status, status);
      assert.equal((await response.json()).success, false);
    }
    assert.equal(upload.mock.callCount(), 0);
  });

  await t.test("rejects invalid studio details before uploading", async () => {
    for (const overrides of [
      { title: " " },
      { category: "Unknown" },
      { hourlyRate: "0" },
      { securityDeposit: "-1" },
      { capacity: "1.5" },
      { amenities: "not JSON" },
      { amenities: JSON.stringify([amenities[0], amenities[0]]) },
      { availableTimeRanges: "[]" },
      { availableTimeRanges: '[{"startTime":"9:00","endTime":"17:00"}]' },
      { availableTimeRanges: '[{"startTime":"17:00","endTime":"09:00"}]' },
    ]) {
      const response = await post(studioForm(overrides));
      assert.equal(response.status, 400, JSON.stringify(overrides));
      assert.equal((await response.json()).success, false);
    }
    assert.equal(upload.mock.callCount(), 0);
    assert.equal(insert.mock.callCount(), 0);
  });

  await t.test("uploads the image and saves normalized data for the authenticated user", async () => {
    const response = await post(studioForm({ userId: "ignored" }));
    assert.equal(response.status, 201);
    assert.equal(upload.mock.callCount(), 1);
    assert.deepEqual(upload.mock.calls[0].arguments[0], {
      folder: "studiospace/studios",
      resource_type: "image",
    });
    assert.equal(insert.mock.callCount(), 1);
    const [saved] = insert.mock.calls[0].arguments;
    assert.deepEqual(saved, {
      title: "Studio A",
      category: "Podcast Studio",
      hourlyRate: 75.5,
      securityDeposit: 0,
      capacity: 4,
      location: "Downtown",
      address: "10 Main St",
      overview: "Ready to record.",
      amenities,
      availableTimeRanges,
      imageUrl: uploadedImage.secure_url,
      publicId: uploadedImage.public_id,
      userId: "studio-owner",
      createdAt: saved.createdAt,
      updatedAt: saved.createdAt,
    });
    assert.ok(saved.createdAt instanceof Date);
    assert.deepEqual(await response.json(), {
      success: true,
      message: "Studio created successfully.",
      studio: { ...JSON.parse(JSON.stringify(saved)), _id: "studio-id" },
    });
    assert.equal(destroy.mock.callCount(), 0);
  });

  await t.test("cleans up the upload when the MongoDB insert fails", async (t) => {
    t.mock.method(console, "error", () => {});
    insert.mock.mockImplementationOnce(async () => { throw new Error("Insert failed"); });

    const response = await post(studioForm());
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { success: false, message: "Failed to create studio." });
    assert.equal(destroy.mock.callCount(), 1);
    assert.deepEqual(destroy.mock.calls[0].arguments, [uploadedImage.public_id]);
  });
});
