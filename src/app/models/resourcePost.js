import mongoose from 'mongoose';

/**
 * An article in the Resources section. `content` is HTML the editor produced,
 * stored only after it has been through the sanitizer in
 * lib/resources/content.js; `toc` and `reading_minutes` are derived from it at
 * save time.
 */
const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    alt: { type: String, default: '' },
  },
  { _id: false },
);

const ResourcePostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Earlier slugs of a published article, which redirect to the current one
    // so links and search results pointing at them keep working.
    previous_slugs: { type: [String], default: [], index: true },

    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    toc: {
      type: [{ id: String, text: String, level: Number, _id: false }],
      default: [],
    },
    word_count: { type: Number, default: 0 },
    reading_minutes: { type: Number, default: 1 },

    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceTopic', default: null, index: true },
    tags: { type: [String], default: [] },
    author_name: { type: String, default: 'CatchMyCash Team' },

    cover_image: { type: ImageSchema, default: () => ({}) },
    faqs: {
      type: [{ question: String, answer: String, _id: false }],
      default: [],
    },

    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    featured: { type: Boolean, default: false },
    published_at: { type: Date, default: null, index: true },

    seo: {
      meta_title: { type: String, default: '' },
      meta_description: { type: String, default: '' },
      focus_keyword: { type: String, default: '' },
      canonical_url: { type: String, default: '' },
      og_image: { type: ImageSchema, default: () => ({}) },
      noindex: { type: Boolean, default: false },
    },

    created_by: { type: String, default: '' },
    updated_by: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

ResourcePostSchema.index({ status: 1, published_at: -1 });

const ResourcePost =
  mongoose.models.ResourcePost || mongoose.model('ResourcePost', ResourcePostSchema);

export default ResourcePost;
