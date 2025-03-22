const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    address: {
      type: Object,
      properties: {
        buidling_number: {
          type: String,
          required: [true, "Please provide a building number"],
        },
        street: {
          type: String,
          required: [true, "Please provide a street"],
        },
        district: {
          type: String,
          required: [true, "Please provide a city"],
        },
        province: {
          type: String,
          required: [true, "Please provide a state"],
        },
        postalcode: {
          type: String,
          required: [true, "Please provide a postalcode"],
          maxlength: [5, "postalcode cannot be more than 5 characters"],
        },
      },
      required: [true, "Please provide an address"],
    },
    tel: {
      type: String,
      required: [true, "Please provide a telephone number"],
      maxlength: [12, "telephone number must be 12 digits"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

HotelSchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "hotel",
  justOne: false,
});

module.exports = mongoose.model("Hotel", HotelSchema);
