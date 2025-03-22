const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const { missingRequiredFields } = require("./lib/resMsg");

const isIntervalValid = (start_date, end_date, res) => {
  const startday = new Date(start_date);
  const endday = new Date(end_date);
  const difftime = Math.abs(endday - startday);
  const diffday = Math.ceil(difftime / (1000 * 60 * 60 * 24));
  const result = diffday <= 3;
  if (!result) {
    res.status(400).json({
      success: false,
      message: `Cannot book exceed 3 days`,
    });
  }
  return result;
};

const canUserViewBooking = (booking, user, res, action) => {
  if (!booking) {
    res.status(404).json({
      success: false,
      message: `Booking with id:${id} does not exist`,
    });
    return false;
  }

  if (booking.user.toString() !== user.id && user.role !== "admin") {
    res.status(401).json({
      success: false,
      message: `User ${user.id} is not authorized to ${action} this booking`,
    });
    return false;
  }
  return true;
};

const findBookingById = async (id, res) => {
  const booking = await Booking.findById(id);
  if (!booking) {
    res.status(404).json({
      success: false,
      message: `Booking with id:${id} does not exist`,
    });
    return undefined;
  }
  return booking;
};

const parseDateAsUTC = (dateString) => {
  if (dateString && !dateString.toUpperCase().endsWith("Z")) {
    dateString += "Z";
  }
  return new Date(dateString);
};

exports.getBookings = async (req, res) => {
  let query;
  if (req.user.role !== "admin") {
    if (req.params.hotelId && req.query.start_date && req.query.end_date) {
      return res.status(403).json({
        success: false,
        message: "User is not authorized to use date range filter",
      });
    }
    query = Booking.find({ user: req.user.id }).populate({
      path: "hotel",
      select: "name address tel",
    });
  } else {
    if (req.params.hotelId && req.query.start_date && req.query.end_date) {
      const { hotelId } = req.params;
      let { start_date, end_date } = req.query;
      start_date = parseDateAsUTC(start_date);
      end_date = parseDateAsUTC(end_date);

      query = Booking.find({
        hotel: hotelId,
        start_date: { $gte: start_date },
        end_date: { $lte: end_date },
      });
    } else if (req.params.hotelId) {
      console.log(req.params.hotelId);
      query = Booking.find({ hotel: req.params.hotelId }).populate({
        path: "hotel",
        select: "name address tel",
      });
    } else {
      query = Booking.find().populate({
        path: "hotel",
        select: "name address tel",
      });
    }
  }

  try {
    const bookings = await query;
    res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find bookings" });
  }
};
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "hotel",
      select: "name address tel",
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    if (!canUserViewBooking(booking, req.user, res, "view")) {
      return;
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find booking" });
  }
};
exports.addBooking = async (req, res) => {
  try {
    req.body.hotel = req.params.hotelId;
    const hotel = await Hotel.findById(req.params.hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `No hotel with the id of ${req.params.hotelId}`,
      });
    }

    req.body.user = req.user.id;
    const {start_date, end_date, user} = req.body;
    if (!user || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        msg: missingRequiredFields([user, start_date, end_date], ["user", "start_date", "end_date"]),
      });
    }

    if (!isIntervalValid(req.body.start_date, req.body.end_date, res)) {
      return;
    }

    const booking = await Booking.create(req.body);

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot create booking" });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    let booking = await findBookingById(req.params.id, res);
    if (!canUserViewBooking(booking, req.user, res, "update")) {
      return;
    }

    if (!isIntervalValid(req.body.start_date, req.body.end_date, res)) {
      return;
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot update booking" });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await findBookingById(req.params.id, res);
    if (!canUserViewBooking(booking, req.user, res, "delete")) {
      return;
    }

    await booking.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot delete booking" });
  }
};
