import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  zip_code: { type: String, required: true },
  state: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User =
  mongoose.models.UserInformation || mongoose.model("UserInformation", UserSchema);

export default User;
