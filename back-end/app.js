const express = require("express");
const port = 8080;
const app = express();
var MongoClient = require("mongodb").MongoClient;
var cors = require("cors");
// Connection URL
var url = "mongodb://localhost:27017/sample-game-db";
const client = new MongoClient(url);

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
app.options("*", cors());

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

app.post("/add", async (request, response) => {
  try {
    await client.connect();
    var db = client.db("game-info");
    await db.collection("user").updateOne(
      { userName: request.body.userName },
      {
        $set: {
          userName: request.body.userName,
          location: request.body.location,
        },
      },
      { upsert: true }
    );
  } catch {
  } finally {
    await client.close();
  }
});
app.get("/get", async (request, response) => {
  try {
    await client.connect();
    var db = client.db("game-info");
    const result = await db
      .collection("user")
      .findOne({ userName: request.query.userName });
    response.send(result.location);
  } catch {
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
