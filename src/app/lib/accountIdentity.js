import { Types } from 'mongoose';
import UserLogin from '../models/userLogin';
import UserDetails from '../models/userDetails';

/**
 * Every UserInformation id that belongs to one account.
 *
 * A claimant is not identified by a single stable id. `UserInformation` is
 * created fresh by each anonymous property search, and `/api/register`
 * re-points `UserLogin.user_id` at whichever record the latest search made.
 * Anything written against the previous id — notifications in particular —
 * then belongs to an id the signed-in session no longer carries, so it
 * silently disappears from the claimant's view.
 *
 * The addresses are recoverable because every claim records the claimant's
 * email against the id that was current when it was filed, so the account's
 * full set of ids is: the one the session holds, plus every id that has filed
 * a claim under the same email.
 *
 * @param {string} userId  The UserInformation id the caller knows about.
 * @returns {Promise<{ids: import('mongoose').Types.ObjectId[], email: string|null}>}
 */
export async function resolveAccountUserIds(userId) {
  if (!Types.ObjectId.isValid(userId)) {
    return { ids: [], email: null };
  }

  const primary = new Types.ObjectId(userId);
  const ids = new Map([[String(primary), primary]]);

  // An id with no login row is still a valid address for notifications — it
  // just has no other ids to gather.
  const login = await UserLogin.findOne({ user_id: primary })
    .select('userEmail')
    .lean();

  const email = login?.userEmail?.trim().toLowerCase() || null;
  if (!email) return { ids: [...ids.values()], email: null };

  // Case-insensitive so an address typed with different capitalisation still
  // resolves to the same person.
  const details = await UserDetails.find({
    email_id: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
  })
    .select('user_id')
    .lean();

  for (const row of details) {
    if (!row?.user_id) continue;
    ids.set(String(row.user_id), row.user_id);
  }

  return { ids: [...ids.values()], email };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A Mongo filter matching every id the account owns.
 *
 * @param {import('mongoose').Types.ObjectId[]} ids
 * @returns {object|null} null when there is nothing safe to match on.
 */
export function userIdFilter(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  return ids.length === 1 ? { user_id: ids[0] } : { user_id: { $in: ids } };
}
