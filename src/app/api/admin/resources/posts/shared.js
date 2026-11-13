import ResourcePost from '../../../../models/resourcePost';

/**
 * Whether a slug is already an article's address, now or as one it used to
 * have (which still redirects to it).
 * @param {string} slug
 * @param {string} [exceptId]  the article being edited
 */
export async function slugTaken(slug, exceptId) {
  const filter = { $or: [{ slug }, { previous_slugs: slug }] };
  if (exceptId) filter._id = { $ne: exceptId };
  return Boolean(await ResourcePost.exists(filter));
}
