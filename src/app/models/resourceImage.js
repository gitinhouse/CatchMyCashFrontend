import mongoose from 'mongoose';

/**
 * An image uploaded from the Resources editor (cover, social card or inside an
 * article), served publicly at /media/<id>. Kept in the database so uploads
 * work wherever the site runs, with no bucket or disk to configure.
 */
const ResourceImageSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  content_type: { type: String, required: true },
  size: { type: Number, required: true },
  original_name: { type: String, default: '' },
  uploaded_by: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
});

const ResourceImage =
  mongoose.models.ResourceImage || mongoose.model('ResourceImage', ResourceImageSchema);

export default ResourceImage;
