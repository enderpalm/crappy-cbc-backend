const express = require("express");
const {
  getHotels,
  createHotel,
  getHotel,
  updateHotel,
  deleteHotel,
  getCount,
} = require("../controllers/hotels");
const { verifyToken, authorize } = require("../middleware/auth");
const bookingRouter = require("./bookings");

const router = express.Router();
router.use("/:hotelId/bookings", bookingRouter);

router
  .route("/")
  .get(getHotels)
  .post(verifyToken, authorize("admin"), createHotel);
router
  .route("/:id")
  .get(getHotel)
  .put(verifyToken, authorize("admin"), updateHotel)
  .delete(verifyToken, authorize("admin"), deleteHotel);

module.exports = router;
