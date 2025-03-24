const Hotel = require("../models/Hotel.js");
const { missingRequiredFields } = require("./lib/resMsg.js");

exports.getHotels = async (req, res) => {
  try {
    let query;
    const reqQuery = { ...req.query };
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach((param) => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`,
    );

    const filters = JSON.parse(queryStr);

    if (req.query.name && req.query.name.trim() !== "") {
      filters.name = { $regex: req.query.name, $options: "i" };
    }

    if (req.query.province && req.query.province.trim() !== "") {
      filters["address.province"] = {
        $regex: req.query.province,
        $options: "i",
      };
    }

    query = Hotel.find(filters);

    // projection
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Hotel.countDocuments();
    query = query.skip(startIndex).limit(limit);

    const hotel = await query;

    // executing pagination
    const pagination = {};
    if (endIndex < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    res
      .status(200)
      .json({ success: true, count: hotel.length, pagination, data: hotel });
  } catch (err) {
    if (err.message) {
      res.status(400).json({ success: false, msg: err.message });
    } else {
      res.status(500).json({ success: false, msg: serverError });
    }
  }
};

exports.getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        msg: `No hotel with the id of ${req.params.id}`,
      });
    }
    res.status(200).json({ success: true, data: hotel });
  } catch (err) {
    console.log(err.stack);
    if (err.message) {
      res.status(400).json({ success: false, msg: err.message });
    } else {
      res.status(500).json({ success: false, msg: serverError });
    }
  }
};

exports.createHotel = async (req, res) => {
  try {
    const { name, address, tel } = req.body;
    if (!name || !address || !tel) {
      return res.status(400).json({
        success: false,
        msg: missingRequiredFields(
          [name, address, tel],
          ["name", "address", "tel"],
        ),
      });
    }
    const { building_number, street, district, province, postalcode } = address;
    if (!building_number || !street || !district || !province || !postalcode) {
      return res.status(400).json({
        success: false,
        msg: missingRequiredFields(
          [building_number, street, district, province, postalcode],
          [
            "address.building_number",
            "address.street",
            "address.district",
            "address.province",
            "address.postalcode",
          ],
        ),
      });
    }
    const hotel = await Hotel.create(req.body);
    res.status(201).json({ success: true, data: hotel });
  } catch (err) {
    if (err.message) {
      res.status(400).json({ success: false, msg: err.message });
    } else {
      res.status(500).json({ success: false, msg: serverError });
    }
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hotel) {
      return res.status(400).json({ success: false });
    }
    res.status(200).json({ success: true, data: hotel });
  } catch (err) {
    console.log(err.stack);
    if (err.message) {
      res.status(400).json({ success: false, msg: err.message });
    } else {
      res.status(500).json({ success: false, msg: serverError });
    }
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel)
      return res.status(404).json({
        success: false,
        msg: `No hotel with the id of ${req.params.id}`,
      });

    await Booking.deleteMany({ hotel: req.params.id });
    await Hotel.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    if (err.message) {
      res.status(400).json({ success: false, msg: err.message });
    } else {
      res.status(500).json({ success: false, msg: serverError });
    }
  }
};
