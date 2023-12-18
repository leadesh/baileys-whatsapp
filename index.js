require("dotenv").config();
const { DisconnectReason } = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;
const express = require("express");
const app = express();
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
const qrCode = require("qrcode");
const mongoConnection = require("./db/dbConnect");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const path = require("path");
const { signAccessToken, verifyAccessToken } = require("./helper/jwt_helper");
const {
  createSignUpValidation,
  createSignInValidation,
} = require("./validation/user.validity");
const MyError = require("./config/error");
const useMongoDBAuthState = require("./auth/mongoAuthState");
const { MongoClient } = require("mongodb");

mongoConnection();
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "client", "dist")));

const server = http.createServer(app);
const io = new Server(server, {
  cors: "http://localhost:3000",
});

const mongoClient = new MongoClient(process.env.mongodb_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoClient.connect().then(() => console.log("mongoClient connected"));

const sock = {};

// Function to set a global variable for a specific ID
function setSock(id, value) {
  sock[id] = value;
}

let groupMessageEventListener;
let connectionUpdateListener;

async function generateQRCode(data) {
  return new Promise((resolve, reject) => {
    qrCode.toDataURL(data, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
}

async function connectionLogic(id, socket, isError) {
  // const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const user = await User.findById(id);
  console.log(user);

  const collection = mongoClient
    .db("whatsapp_api")
    .collection(`auth_info_${id}`);

  const chatsCollection = mongoClient
    .db("whatsapp_chats")
    .collection(`all_chats_${id}`);

  const { state, saveCreds } = await useMongoDBAuthState(collection);

  try {
    if (isError || user.isLogged === false) {
      let sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
      });
      setSock(id, sock);
    } else {
      sock[id].ev.off("messages.upsert", groupMessageEventListener);
      sock[id].ev.off("connection.update", connectionUpdateListener);
    }
  } catch (error) {
    console.error(error);
  }

  connectionUpdateListener = async (update) => {
    const { connection, lastDisconnect } = update;
    if (!connection && update?.qr) {
      const qrCodeDataURL = await generateQRCode(update.qr);
      console.log("QR created");
      socket.emit("qrCode", qrCodeDataURL);
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect.error,
        ", reconnecting ",
        shouldReconnect
      );

      if (
        lastDisconnect.error?.output?.statusCode === DisconnectReason.loggedOut
      ) {
        console.log("User logged out Rereun the connection");
        // Handle user logout, perform cleanup, or redirect as needed
        await mongoClient.db("whatsapp_api").dropCollection(`auth_info_${id}`);
        user.isLogged = false;
        await user.save();
        socket.emit("user disconnected");
      }

      //   if (lastDisconnect.error?.output?.statusCode === 440) {
      //     await mongoClient.db("whatsapp_api").dropCollection(`auth_info_${id}`);
      //     connectionLogic(id, socket);
      //   }

      if (shouldReconnect) {
        connectionLogic(id, socket, true);
      }
    } else if (connection === "open") {
      console.log("opened connection");
      user.isLogged = true;
      await user.save();
      socket.emit("user connected");
    }
  };

  groupMessageEventListener = async (messageInfoUpsert) => {
    if (
      messageInfoUpsert.messages[0].key.remoteJid.split("@")[1] === "g.us" &&
      messageInfoUpsert.messages[0].message?.conversation
    ) {
      const user = await User.findById(id);
      const tags = user.tags;
      const newMessage = messageInfoUpsert.messages[0].message?.conversation;
      const isRequiredMessage =
        tags.length === 0
          ? true
          : tags.reduce((accum, curr) => {
              if (accum) return accum;
              else {
                const regex = new RegExp(curr, "i");
                console.log(accum, curr, newMessage);
                console.log(regex.test(newMessage));
                return regex.test(newMessage);
              }
            }, false);
      console.log(isRequiredMessage);
      const newGrpMessage = {
        conversation: messageInfoUpsert.messages[0].message?.conversation,
        username: messageInfoUpsert.messages[0].pushName,
        phoneNumber: messageInfoUpsert.messages[0].key.participant
          .split("@")[0]
          .slice(2),
        timestamp: new Date(
          messageInfoUpsert.messages[0].messageTimestamp * 1000
        ).toISOString(),
      };
      //   console.log(messageInfoUpsert.messages[0]);
      if (isRequiredMessage) {
        socket.emit("new message", newGrpMessage);
        chatsCollection.insertOne(newGrpMessage);
        console.log(newGrpMessage);
      }
    }
  };

  sock[id].ev.on("connection.update", connectionUpdateListener);
  sock[id].ev.on("messages.upsert", groupMessageEventListener);

  sock[id].ev.on("creds.update", saveCreds);

  if (user.isLogged === true) {
    socket.emit("user connected");
  }
}

app.get("/", (req, res) => {
  res.status(200).json("Hey this is done");
});

app.post("/api/signup", async (req, res, next) => {
  try {
    await createSignUpValidation.validateAsync(req.body);
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email });
    await newUser.save();
    const token = await signAccessToken(newUser.id);
    const maxAgeInSeconds = 10 * 24 * 60 * 60;
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAgeInSeconds,
    });
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

app.get("/api/getMe", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

app.post("/api/signin", async (req, res, next) => {
  try {
    await createSignInValidation.validateAsync(req.body);
    const { email, password } = req.body;
    console.log(email, password);
    const validUser = await User.checkUser(email, password);

    if (!validUser) throw new MyError("Invalid email or password");
    const token = await signAccessToken(validUser.id);
    const maxAgeInSeconds = 10 * 24 * 60 * 60;
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAgeInSeconds,
    });

    res.status(200).json(validUser);
  } catch (error) {
    next(error);
  }
});

app.get("/api/refreshMessages", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;
    const chatsCollection = mongoClient
      .db("whatsapp_chats")
      .collection(`all_chats_${data.id}`);
    console.log(sock);

    const messages = await chatsCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
});

app.post("/api/tag/add", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;
    const { tag } = req.body;
    const userTag = await User.findByIdAndUpdate(
      data.id,
      { $addToSet: { tags: tag } },
      { new: true }
    );
    if (userTag) {
      return res.status(201).json(userTag);
    } else {
      return res.status(404).json("User not found");
    }
  } catch (error) {
    next(error);
  }
});

app.post("/api/tag/del", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;
    const { tag: deleteTag } = req.body;
    let user = await User.findById(data.id);

    let tags = user.tags;
    tags = tags.filter((tag) => tag !== deleteTag);
    user.tags = tags;
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

// app.get("/createServer", verifyAccessToken, (req, res) => {
//   const data = req.data;
//   connectionLogic(data.id);
//   res.status(200).json("Server created");
// });

process.on("exit", async () => {
  User.updateMany({}, { isLogged: false });
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("whatsapp connect", (id) => {
    connectionLogic(id, socket, false);
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    status: err.status || 500,
    message: err.message || "Internal Server error",
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});