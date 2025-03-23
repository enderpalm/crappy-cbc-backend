const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

//security
const { xss } = require("express-xss-sanitizer");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");

// import routes
const hotels = require("./routes/hotels");
const auth = require("./routes/auth");
const bookings = require("./routes/bookings");

const connectDB = require("./config/db");
const morgan = require("morgan");

dotenv.config({ path: "./config/config.env" });
connectDB();

// setup express object and routes
const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// security
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});
// app.use(limiter);
app.use(hpp());
app.use(cors());

app.use("/api/v1/hotels", hotels);
app.use("/api/v1/auth", auth);
app.use("/api/v1/bookings", bookings);

// listening to request on port 5000
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 5000;
const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on ${HOST}:${PORT}`,
  ),
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
