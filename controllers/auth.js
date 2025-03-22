const User = require("../models/User");
const { missingRequiredFields, serverError } = require("./lib/resMsg");

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") options.secure = true;

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
};

exports.register = async (req, res) => {
  const { name, email, password, tel, role } = req.body;

  if (!name || !email || !password || !tel || !role) {
    res.status(400).json({
      success: false,
      msg: missingRequiredFields(
        [name, email, password, tel, role],
        ["name", "email", "password", "tel", "role"],
      ),
    });
    return;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res
      .status(400)
      .json({ success: false, msg: "User with that email already exists." });
    return;
  }

  try {
    const newUser = new User({ name, email, password, tel, role });
    await newUser.save();
    sendTokenResponse(newUser, 201, res);
  } catch (error) {
    if (error.message) {
      res.status(400).json({ success: false, msg: error.message });
    } else {
      res.status(501).json({ success: false, msg: serverError });
    }
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      msg: missingRequiredFields([email, password], ["email", "password"]),
    });
    return;
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    res
      .status(400)
      .json({ success: false, msg: "User with that email doesn't exist." });
    return;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401).json({ success: false, msg: "The password is wrong" });
    return;
  }

  sendTokenResponse(user, 200, res);
};

exports.logout = async (_req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
};

exports.updateUser = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      tel: req.body.tel,
    };

    if (req.body.email || req.body.password) {
      const forbiddenFields = [];
      if (req.body.email) forbiddenFields.push("email");
      if (req.body.password) forbiddenFields.push("password");
      res.status(400).json({
        success: false,
        msg: `Forbidden update to fields: ${forbiddenFields.join(", ")}`,
      });
      return;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.log(err.stack);
    res.status(400).json({ success: false });
  }
};
