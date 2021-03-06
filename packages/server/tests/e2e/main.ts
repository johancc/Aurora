import { setupMocks } from "../utils";
(async () => {
  await setupMocks();
})();

import chai, { expect } from "chai";
import chaiSubset from "chai-subset";
import { agent, SuperAgentTest } from "supertest";
import http from "http";
import { connect, clearDatabase, closeDatabase } from "../utils";
import createHttpServer from "../../src/server";
import { testMentor, testParent } from "../data";
import { IMentor } from "../../src/models/Mentors";
import mongoose from "mongoose";
import { IParent } from "../../src/models/Parents";

let app: SuperAgentTest;
let server: http.Server;

chai.use(chaiSubset);
/**
 * Start a new server & connect to a new in-memory database before running any tests.
 */
before(async function () {
  this.timeout(120000); // 2 mins to download a local MongoDB installation.
  await connect();
  await createHttpServer().then((s) => {
    server = s;
    app = agent(server);
  });
});

/**
 * Clear all test data after every test.
 */
afterEach(async () => {
  await clearDatabase();
  await app.post("/logout");
});

/**
 * Remove and close the db and server.
 */
after(async () => closeDatabase());

describe("💾 Server", () => {
  it("is alive", async () => {
    const res = await app.get("/heartbeat");
    expect(res.status).to.equal(200);
  });

  describe("/users 😷", () => {
    describe("/mentor", () => {
      it("POST - creates new user", async () => {
        const res = await app
          .post("/users/mentor")
          .send({ mentor: testMentor, token: { uid: testMentor.firebaseUID } });
        expect(res.status).to.be.equal(200);
        expect(res.body._id).to.exist;
        expect(res.body as IMentor).to.deep.contain(testMentor);
      });

      it("POST - rejects empty requests", async () => {
        const res = await app.post("/users/mentor");
        expect(res.status).to.be.equal(401);
      });

      it("POST - rejects partial data", async () => {
        const res = await app.post("/users/mentor").send({
          mentor: { name: "Alyssa P Hacker" },
          token: { uid: testMentor.firebaseUID },
        });
        expect(res.status).to.be.equal(400);
      });

      it("POST - rejects invalid firebaseUID", async () => {
        const res = await app.post("/users/mentor").send({
          mentor: { name: "Alyssa P Hacker", firebaseUID: "" },
          token: { uid: testMentor.firebaseUID },
        });
        expect(res.status).to.be.equal(400);
      });

      it("POST - rejects missing token", async () => {
        const res = await app
          .post("/users/mentor")
          .send({ mentor: testMentor });
        expect(res.status).to.be.equal(401);
      });

      it("POST - rejects invalid phone number", async () => {
        const res = await app.post("/users/mentor").send({
          mentor: { name: "Alyssa P Hacker", phone: 0 },
          token: { uid: testMentor.firebaseUID },
        });
        expect(res.status).to.be.equal(400);
      });

      it("PUT - updates user", async () => {
        const res = await app.post("/users/mentor").send({
          mentor: testMentor,
          token: { uid: testMentor.firebaseUID },
        });
        expect(res.status).to.be.equal(200);
        expect(res.body._id).to.exist;
        expect(res.body as IMentor).to.deep.contain(testMentor);
        const mentorUpdate = {
          ...testMentor,
          name: "Jack Florey",
          introduction: "Hi Jack!",
        };
        const update = await app.put("/users/mentor").send({
          mentor: mentorUpdate,
          token: { uid: testMentor.firebaseUID },
        });
        expect(update.status).to.be.equal(200);

        const getMentor = await app
          .get("/users/mentor")
          .query({ _id: res.body._id });
        expect(getMentor.status).to.be.equal(200);
        expect(getMentor.body.name).to.be.equal(mentorUpdate.name);
        expect(getMentor.body.introduction).to.be.equal(
          mentorUpdate.introduction
        );
      });

      it("PUT - rejects empty requests", async () => {
        const res = await app.put("/users/mentor");
        expect(res.status).to.be.equal(401);
      });

      it("POST - rejects missing token", async () => {
        const res = await app.put("/users/mentor").send({ mentor: testMentor });
        expect(res.status).to.not.be.equal(200);
      });

      it("PUT - rejects invalid phone number", async () => {
        const res = await app.post("/users/mentor").send({
          mentor: testMentor,
          token: { uid: testMentor.firebaseUID },
        });
        expect(res.status).to.be.equal(200);

        const mentorUpdate = {
          ...res.body,
          phone: "11111",
        };
        const update = await app.put("/users/mentor").send({
          mentor: mentorUpdate,
          token: { uid: testMentor.firebaseUID },
        });
        expect(update.status).to.not.be.equal(200);
        const getMentor = await app
          .get("/users/mentor")
          .query({ _id: res.body._id });
        expect(getMentor.status).to.be.equal(200);
        expect(getMentor.body.phone).to.be.equal(testMentor.phone);
      });

      it("GET - gets a mentor", async () => {
        const setup = await app
          .post("/users/mentor")
          .send({ mentor: testMentor, token: { uid: testMentor.firebaseUID } });
        expect(setup.status).to.be.equal(200);
        const res = await app
          .get("/users/mentor")
          .query({ _id: setup.body._id });
        expect(res.status).to.be.equal(200);
      });

      it("GET - rejects invalid id", async () => {
        const setup = await app
          .post("/users/mentor")
          .send({ mentor: testMentor, token: { uid: testMentor.firebaseUID } });
        expect(setup.status).to.be.equal(200);

        const res = await app
          .get("/users/mentor")
          .query({ _id: "" })
          .set({ token: setup.body._id });
        expect(res.status).to.be.equal(400);
      });

      it("GET - rejects non-existent id", async () => {
        const setup = await app
          .post("/users/mentor")
          .send({ mentor: testMentor, token: { uid: testMentor.firebaseUID } });
        expect(setup.status).to.be.equal(200);
        const res = await app
          .get("/users/mentor")
          .query({ _id: mongoose.Types.ObjectId().toHexString() })
          .set({ token: setup.body._id });
        expect(res.status).to.be.equal(404);
      });

      it("DELETE - deletes a mentor", async () => {
        const setup = await app
          .post("/users/mentor")
          .send({ mentor: testMentor, token: { uid: testMentor.firebaseUID } });
        const res = await app
          .delete("/users/mentor")
          .send({ _id: setup.body._id })
          .set({ token: setup.body._id });
        expect(res.status).to.be.equal(200);
      });

      it("DELETE - fails nicely", async () => {
        const setup = await app
          .post("/users/mentor")
          .send({ mentor: testMentor, token: { uid: testMentor.firebaseUID } });
        await app.delete("/users/mentor").send({ _id: setup.body._id });
        const res = await app
          .delete("/users/mentor")
          .send({ _id: setup.body._id })
          .set({ token: setup.body._id });
        expect(res.status).to.be.equal(401);
      });
      it("DELETE - rejects invalid requests", async () => {
        const setup = await app
          .post("/users/mentor")
          .send({ mentor: testMentor, token: { uid: testMentor.firebaseUID } });
        const res = await app
          .delete("/users/mentor")
          .send({ _id: 8 })
          .set({ token: setup.body._id });
        expect(res.status).to.be.equal(400);
      });
    });

    describe("/parent", () => {
      it("POST - creates new parent", async () => {
        const res = await app
          .post("/users/parent")
          .send({ parent: testParent, token: { uid: testParent.firebaseUID } });
        expect(res.status).to.be.equal(200);
        expect(res.body._id).to.exist;
        expect(res.body).to.containSubset(testParent);
      });

      it("POST - rejects empty requests", async () => {
        const res = await app.post("/users/parent");
        expect(res.status).to.be.equal(401);
      });

      it("POST - rejects partial data", async () => {
        const res = await app.post("/users/parent").send({
          parent: { name: "Alyssa P Hacker" },
          token: { uid: testParent.firebaseUID },
        });
        expect(res.status).to.be.equal(400);
      });

      it("POST - rejects invalid firebaseUID", async () => {
        const res = await app.post("/users/parent").send({
          parent: { name: "Alyssa P Hacker", firebaseUID: "0000" },
          token: { uid: testParent.firebaseUID },
        });
        expect(res.status).to.be.equal(400);
      });

      it("POST - rejects invalid phone number", async () => {
        const res = await app.post("/users/parent").send({
          parent: { name: "Alyssa P Hacker", phone: 0 },
          token: { uid: testParent.firebaseUID },
        });
        expect(res.status).to.be.equal(400);
      });

      it("PUT - updates user", async () => {
        const res = await app
          .post("/users/parent")
          .send({ parent: testParent, token: { uid: testParent.firebaseUID } });
        expect(res.status).to.be.equal(200);
        expect(res.body._id).to.exist;
        const parentUpdate = {
          ...testParent,
          name: "Jack Florey",
        };
        const update = await app.put("/users/parent").send({
          parent: parentUpdate,
          token: { uid: testParent.firebaseUID },
        });
        expect(update.status).to.be.equal(200);

        const getParent = await app
          .get("/users/parent")
          .query({ _id: res.body._id });
        expect(getParent.status).to.be.equal(200);
        expect(getParent.body.name).to.be.equal(parentUpdate.name);
      });

      it("PUT - can add students ", async () => {
        const res = await app
          .post("/users/parent")
          .send({ parent: testParent, token: { uid: testParent.firebaseUID } });
        expect(res.status).to.be.equal(200);
        expect(res.body._id).to.exist;
        const parentUpdate = {
          ...testParent,
          name: "Jack Florey",
          students: testParent.students.concat({
            name: "Billy",
            gradeLevel: "Middle School",
            subjects: ["Math"],
          }),
        };
        const update = await app.put("/users/parent").send({
          parent: parentUpdate,
          token: { uid: testParent.firebaseUID },
        });
        expect(update.status).to.be.equal(200);
        expect(update.body.students.length).to.be.equal(
          testParent.students.length + 1
        );
        expect(
          update.body.students.filter((s) => s._id !== undefined).length
        ).to.be.equal(testParent.students.length + 1);
        const getParent = await app
          .get("/users/parent")
          .query({ _id: res.body._id });
        expect(getParent.status).to.be.equal(200);
        expect(getParent.body.name).to.be.equal(parentUpdate.name);
      });

      it("PUT - rejects empty requests", async () => {
        const res = await app.put("/users/parent");
        expect(res.status).to.be.equal(401);
      });

      it("POST - rejects missing token", async () => {
        const res = await app.put("/users/parent").send({ parent: testParent });
        expect(res.status).to.not.be.equal(200);
      });

      it("PUT - rejects invalid phone number", async () => {
        const res = await app.post("/users/parent").send({
          parent: testParent,
          token: { uid: testParent.firebaseUID },
        });
        expect(res.status).to.be.equal(200);

        const parentUpdate: IParent = {
          ...res.body,
          phone: "11111",
        };
        const update = await app.put("/users/parent").send({
          mentor: parentUpdate,
          token: { uid: testParent.firebaseUID },
        });
        expect(update.status).to.not.be.equal(200);

        const getParent = await app
          .get("/users/parent")
          .query({ _id: res.body._id });
        expect(getParent.status).to.be.equal(200);
        expect(getParent.body.phone).to.be.equal(testParent.phone);
      });

      it("GET - gets a parent", async () => {
        const setup = await app
          .post("/users/parent")
          .send({ parent: testParent, token: { uid: testParent.firebaseUID } });
        expect(setup.status).to.be.equal(200);

        const res = await app
          .get("/users/parent")
          .query({ _id: setup.body._id });
        expect(res.status).to.be.equal(200);
        expect(res.body).to.containSubset(testParent);
        expect(res.body).to.containSubset(setup.body);
      });

      it("GET - rejects invalid id", async () => {
        const res = await app.get("/users/parent").query({ _id: "" });
        expect(res.status).to.be.equal(401);
      });

      it("GET - rejects non-existent id", async () => {
        const res = await app
          .get("/users/parent")
          .query({ _id: mongoose.Types.ObjectId().toHexString() });
        expect(res.status).to.be.equal(401);
      });

      it("DELETE - deletes a parent", async () => {
        const setup = await app
          .post("/users/parent")
          .send({ parent: testParent, token: { uid: testParent.firebaseUID } });
        const res = await app
          .delete("/users/parent")
          .send({ _id: setup.body._id });
        expect(res.status).to.be.equal(200);
      });

      it("DELETE - fails nicely", async () => {
        const setup = await app
          .post("/users/parent")
          .send({ parent: testParent, token: { uid: testParent.firebaseUID } });
        const del = await app
          .delete("/users/parent")
          .send({ _id: setup.body._id });
        expect(del.status).to.be.equal(200);
        const res = await app
          .delete("/users/parent")
          .send({ _id: setup.body._id });
        expect(res.status).to.be.equal(401);
      });

      it("DELETE - rejects invalid ids", async () => {
        const res = await app
          .delete("/users/parent")
          .send({ _id: mongoose.Types.ObjectId().toHexString() });
        expect(res.status).to.be.equal(401);
      });

      it("DELETE - rejects invalid requests", async () => {
        const res = await app.delete("/users/parent").send({ _id: 8 });
        expect(res.status).to.be.equal(401);
      });
    });
  });
});
