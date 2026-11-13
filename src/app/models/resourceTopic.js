import mongoose from 'mongoose';

/** A topic that groups Resources articles, with a page of its own. */
const ResourceTopicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    // Lower comes first on the hub and in menus.
    order: { type: Number, default: 0 },
    seo: {
      meta_title: { type: String, default: '' },
      meta_description: { type: String, default: '' },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

const ResourceTopic =
  mongoose.models.ResourceTopic || mongoose.model('ResourceTopic', ResourceTopicSchema);

export default ResourceTopic;
