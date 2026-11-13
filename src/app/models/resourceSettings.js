import mongoose from 'mongoose';

/** Editable text and SEO for the Resources hub page (a single document). */
const ResourceSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'hub' },
    heading: { type: String, default: '' },
    intro: { type: String, default: '' },
    meta_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    updated_by: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

const ResourceSettings =
  mongoose.models.ResourceSettings || mongoose.model('ResourceSettings', ResourceSettingsSchema);

export default ResourceSettings;
