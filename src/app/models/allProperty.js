import mongoose from "mongoose";

const AllPropertySchema = new mongoose.Schema({
  property_id: { type: String, required: true },
  property_type: { type: String, required: false },
  cash_reported: { type: String, required: false },
  shares_reported: { type: String, required: false },
  name_of_security_reported: { type: String, required: false },
  no_of_owners: { type: String, required: false },
  owner_name: { type: String, required: false },
  owner_street_1: { type: String, required: false },
  owner_street_2: { type: String, required: false },
  owner_street_3: { type: String, required: false },
  owner_city: { type: String, required: false },
  owner_state: { type: String, required: false },
  owner_zip: { type: String, required: false },
  owner_country_code: { type: String, required: false },
  current_cash_balance: { type: String, required: false },
  no_of_pending_claimes: { type: String, required: false },
  no_of_paid_claimes: { type: String, required: false },
  holder_name: { type: String, required: false },
  holder_street_1: { type: String, required: false },
  holder_street_2: { type: String, required: false },
  holder_street_3: { type: String, required: false },
  holder_city: { type: String, required: false },
  holder_state: { type: String, required: false },
  holder_zip: { type: String, required: false },
  cusip: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

const AllProperty =
  mongoose.models.AllProperty ||
  mongoose.model("AllProperty", AllPropertySchema);

export default AllProperty;
