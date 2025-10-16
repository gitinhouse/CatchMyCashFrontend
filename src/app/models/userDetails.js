import mongoose from "mongoose";

const UserDetailsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserInformation",
    required: true,
  },
  legal_name: { type: String, required: true },
  date_of_birth: { type: String, required: true },
  email_id: { type: String, required: true },
  contact_no: { type: String, required: true },
  ssn_id: { type: String, required: true },
  company_name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  zip_code: { type: String, required: true },
  state: { type: String, required: true },
  formal_employer: { type: String, required: false },
  previous_address: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

const UserDetails =
  mongoose.models.UserDetails ||
  mongoose.model("UserDetails", UserDetailsSchema);

export default UserDetails;
