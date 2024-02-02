require("dotenv").config();
const { DisconnectReason, Browsers } = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;
const express = require("express");
const app = express();
let referralCodes;
import("referral-codes").then((referralCode) => {
  referralCodes = referralCode;
});
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
const qrCode = require("qrcode");
const mongoConnection = require("./db/dbConnect");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const path = require("path");
const admin = require("firebase-admin");
const serviceAccount = require("./path/to/your/firebase-credentials.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const { signAccessToken, verifyAccessToken } = require("./helper/jwt_helper");
const {
  createSignUpValidation,
  createSignInValidation,
  passwordValidation,
  createMessageValidation,
} = require("./validation/user.validity");
const MyError = require("./config/error");
const useMongoDBAuthState = require("./auth/mongoAuthState");
const { MongoClient, ObjectId } = require("mongodb");
const tagRouter = require("./routes/tag.route");
const packageRouter = require("./routes/package.route");
const stripeRouter = require("./routes/stripe.route");
const adminRouter = require("./routes/admin.route");
const Tag = require("./models/tag");
const Message = require("./models/message");

mongoConnection();
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ credentials: true, origin: true }));
app.use(express.static(path.join(__dirname, "client", "dist")));
app.use("/api/tag", tagRouter);
app.use("/api/package", packageRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/admin", adminRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const mongoClient = new MongoClient(process.env.mongodb_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoClient.connect().then(() => console.log("mongoClient connected"));

const port = process.env.PORT || 3000;

const sock = {};

// Function to set a global variable for a specific ID
function setSock(id, value) {
  sock[id] = value;
}

async function markedLogged() {
  await User.updateMany({}, { $set: { isLogged: false } });
}

markedLogged();

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

async function generateRandomString() {
  const randomCode = referralCodes.generate({
    length: 6,
    count: 1,
    charset: referralCodes.charset("alphanumeric"),
  })[0];

  const uniqueCode = await User.findOne({ referralCode: randomCode });
  if (uniqueCode) {
    // Generate a new number if it is not unique
    return generateRandomString();
  }

  // Return the unique number
  return randomCode;
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
        defaultQueryTimeoutMs: undefined,
      });
      setSock(id, sock);
    } else {
      sock[id].ev.removeAllListeners("messages.upsert");
      sock[id].ev.removeAllListeners("connection.update");
    }
  } catch (error) {
    console.error(error);
  }

  if (!sock[id]) {
    connectionLogic(id, socket, true);
    console.log(user.isLogged, id, "retrying connection");
  }

  let connectionUpdateListener = async (update) => {
    const { connection, lastDisconnect } = update;
    try {
      if (!connection && update?.qr) {
        const qrCodeDataURL = await generateQRCode(update.qr);
        console.log("QR created");
        socket.emit("qrCode", qrCodeDataURL);
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut &&
          lastDisconnect?.error?.output?.payload?.message !==
          "QR refs attempts ended";
        console.log(
          "connection closed due to ",
          lastDisconnect.error,
          ", reconnecting ",
          shouldReconnect
        );

        if (
          lastDisconnect.error?.output?.statusCode ===
          DisconnectReason.loggedOut
        ) {
          console.log("User logged out Rereun the connection");
          // Handle user logout, perform cleanup, or redirect as needed
          await mongoClient
            .db("whatsapp_api")
            .dropCollection(`auth_info_${id}`);
          try {
            user.isLogged = false;
            await user.save();
            socket.emit("user disconnected");
            delete sock[id];
          } catch (error) {
            console.error(error);
          }
        }

        if (
          lastDisconnect?.error?.output?.payload?.message ===
          "QR refs attempts ended"
        ) {
          socket.emit("request timed out");
          console.log("Request timed out");
        }

        // if (
        //   lastDisconnect.error?.output?.statusCode === DisconnectReason.timedOut
        // ) {
        //   connectionLogic(id, socket, true);
        // }
        // console.log(DisconnectReason);

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
    } catch (error) {
      console.error(error);
    }
  };

  let groupMessageEventListener = async (messageInfoUpsert) => {
    try {
      if (
        messageInfoUpsert.messages[0].key.remoteJid.split("@")[1] === "g.us" &&
        (messageInfoUpsert.messages[0].message?.conversation ||
          messageInfoUpsert.messages[0].message?.extendedTextMessage?.text)
      ) {
        const allTags = await Tag.find({ owner: id });
        const tags = allTags.map((tag) => tag.value);
        let newMessage = messageInfoUpsert.messages[0].message?.conversation;
        if (!newMessage) {
          newMessage =
            messageInfoUpsert.messages[0].message?.extendedTextMessage?.text +
            messageInfoUpsert.messages[0].message?.extendedTextMessage?.title;
        }
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
          ...(messageInfoUpsert.messages[0].message?.extendedTextMessage
            ?.title && {
            title:
              messageInfoUpsert.messages[0].message?.extendedTextMessage?.title,
          }),
          conversation:
            messageInfoUpsert.messages[0].message?.conversation ||
            messageInfoUpsert.messages[0].message?.extendedTextMessage?.text,
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
          const newMessage = new Message({ ...newGrpMessage, userId: id });
          await newMessage.save();

          socket.emit("new message", newMessage);
          console.log(newGrpMessage);
        }
      }
    } catch (error) {
      console.log(error);
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
  console.log("request received");
  res.status(200).json("Hey this is done");
});

app.post("/api/signup", async (req, res, next) => {
  try {
    await createSignUpValidation.validateAsync(req.body);
    const { name, password, number, referralCode } = req.body;
    // const isUser = await admin.auth().getUserByPhoneNumber(number);
    // if (!isUser) {
    //   return res.status(401).json("Phone number has not been authenticated");
    // }

    let referredUser = false;

    if (referralCode?.trim().length > 0) {
      referredUser = await User.findOne({ referralCode });
      if (!referredUser) {
        res.status(422).json("Invalid referral code");
      }
    }

    const referralInfo = referredUser ? [referredUser.id] : [];

    const newGeneratedCode = await generateRandomString(6);
    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser = new User({
      name,
      password: hashedPassword,
      number,
      referralCode: newGeneratedCode,
      referrals: referralInfo,
    });
    await newUser.save();
    await newUser.populate("packageSelected");

    if (referredUser) {
      referredUser.referrals = referredUser.referrals.concat(newUser.id);
      await referredUser.save();
    }
    const token = await signAccessToken(newUser.id);
    const maxAgeInSeconds = 10 * 24 * 60 * 60 * 1000;
    res.setHeader("jwt", token);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAgeInSeconds,
      sameSite: "none",
      secure: true,
    });
    res.status(201).json({ ...newUser._doc, jwt: token });
  } catch (error) {
    next(error);
  }
});

app.get("/api/getMe", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;
    console.log(data);
    const token = req.cookies.jwt;
    res.status(200).json({ ...data._doc, jwt: token });
  } catch (error) {
    next(error);
  }
});

app.post("/api/signin", async (req, res, next) => {
  try {
    await createSignInValidation.validateAsync(req.body);
    const { number, password } = req.body;
    const isUser = await admin.auth().getUserByPhoneNumber(number);
    if (!isUser) {
      return res.status(401).json("Phone number has not been authenticated");
    }
    console.log(number, password);
    const validUser = await User.checkUser(number, password);

    if (!validUser) throw new MyError("Invalid phone number or password");
    const token = await signAccessToken(validUser.id);
    const maxAgeInSeconds = 10 * 24 * 60 * 60 * 1000;
    res.setHeader("jwt", token);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAgeInSeconds,
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({ ...validUser._doc, jwt: token });
  } catch (error) {
    next(error);
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json("Logout success");
});

app.get("/api/refreshMessages", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;
    console.log(data);

    const messages = await Message.find({ userId: data.id })
      .sort({ timestamp: -1 })
      .limit(20);

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
});

app.post("/api/user", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;
    const { username, newNumber } = req.body;
    if (newNumber && newNumber.trim().length > 0) {
      const isUser = await admin.auth().getUserByPhoneNumber(newNumber);
      if (!isUser) {
        return res.status(401).json("Phone number has not been authenticated");
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      data.id,
      { $set: { name: username, number: newNumber } },
      { new: true }
    ).populate("packageSelected");

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
    console.log(error);
  }
});

// app.get("/createServer", verifyAccessToken, (req, res) => {
//   const data = req.data;
//   connectionLogic(data.id);
//   res.status(200).json("Server created");
// });

app.post("/api/message/star/:id", verifyAccessToken, async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const data = req.data;

    const updatedOne = await Message.findByIdAndUpdate(
      messageId,
      [{ $set: { isStarred: { $not: "$isStarred" } } }],
      { new: true }
    );

    res
      .status(200)
      .json({ message: "chat status changed", updatedMessage: updatedOne });
  } catch (error) {
    next(error);
  }
});

app.get("/api/message/star", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;

    const chatsCollection = mongoClient
      .db("whatsapp_chats")
      .collection(`all_chats_${data.id}`);

    const allStarredMessages = await Message.find({ isStarred: true });

    res.status(200).json(allStarredMessages);
  } catch (error) {
    next(error);
  }
});

app.post("/api/message", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;
    await createMessageValidation.validateAsync(req.body);

    const newMessage = new Message({ ...req.body, userId: data.id });
    await newMessage.save();

    res.status(200).json(newMessage);
  } catch (error) {
    next(error);
  }
});

app.get("/api/dashboard", verifyAccessToken, async (req, res, next) => {
  try {
    const { packageSelected } = req.data;
    const userId = req.data.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayMessages = await Message.find({
      userId,
      timestamp: {
        $gte: todayStart.toISOString(),
        $lte: todayEnd.toISOString(),
      },
    }).size();

    const totalMessages = await Message.find({ userId }).size();

    const totalStarredMessages = await Message.find({ isStarred: true }).size();

    res.status(200).json({
      trialEndData: packageSelected.trialPeriodEndTime,
      subscribedPackage: packageSelected.name,
      totalKeywords: packageSelected.maxKeyword,
      todayTotalMessages: todayMessages,
      totalMessages,
      totalStarredMessages,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/password", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;
    const { oldPassword, newPassword } = req.body;
    console.log(data.number, oldPassword);
    await passwordValidation.validateAsync(oldPassword);
    await passwordValidation.validateAsync(newPassword);

    const validUser = await User.checkUser(data.number, oldPassword);
    if (!validUser) throw new MyError("Invalid phone number or password");

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    const newUser = await User.findByIdAndUpdate(data.id, {
      $set: { password: newHashedPassword },
    })
      .populate("tags")
      .populate("packageSelected");

    res.status(200).json(newUser);
  } catch (error) {
    next(error);
  }
});

process.on("exit", async () => {
  console.log("App exiting...");
  await User.updateMany({}, { $set: { isLogged: false } });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Handle the error or terminate the process if necessary
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

server.listen(port, () => {
  console.log("listening on *:3000");
});
