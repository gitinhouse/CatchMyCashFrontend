import mongoose from 'mongoose';

const AllPropertySchema = new mongoose.Schema({
  property_id: { type: String, index: true },
  property_type: String,
  owner_name: { type: String, index: true },
  owner_street_1: String,
  owner_street_2: String,
  owner_street_3: String,
  owner_city: String,
  owner_state: String,
  owner_zip: String,
  cash_reported: String,
  shares_reported: String,
  current_cash_balance: String,
}, { 
  collection: 'allproperties',
  timestamps: true 
});

// Add compound index for common queries
AllPropertySchema.index({ owner_name: 1, property_id: 1 });

// ✅ This is correct - factory function only
export function getPropertyModel(connection) {
  if (connection.models && connection.models.AllProperty) {
    return connection.models.AllProperty;
  }
  return connection.model('AllProperty', AllPropertySchema);
}