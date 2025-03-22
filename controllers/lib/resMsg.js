exports.invalidCredentials = "Invalid credentials";
exports.serverError = "Server error";
exports.missingRequiredFields = (values, flag) => {
  const missingField = [];
  values.forEach((value, index) => !value && missingField.push(flag[index]));
  return `Missing required field(s): ${missingField.join(", ")}`;
};
