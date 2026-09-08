import { NextResponse } from 'next/server';
import { verifyToken } from './verifyToken';

/**
 * Verify the request carries a valid JWT belonging to an Admin account.
 *
 * The JWT issued by /api/login already carries `type` ("Admin" | "User"), so we
 * can authorise without an extra database round trip.
 *
 * @param {Request} req
 * @returns {{ id: string, email: string, type: string, user_id?: string }}
 * @throws {Error} with `status` set to 401 (no/expired token) or 403 (not admin)
 */
export function requireAdmin(req) {
  let decoded;
  try {
    decoded = verifyToken(req);
  } catch (err) {
    const error = new Error(err.message || 'Unauthorized');
    error.status = 401;
    throw error;
  }

  if (decoded?.type !== 'Admin') {
    const error = new Error('Forbidden: admin access required');
    error.status = 403;
    throw error;
  }

  return decoded;
}

/**
 * Wrap an admin route handler so auth failures and unexpected errors are
 * translated into consistent JSON responses.
 *
 * @param {(req: Request, ctx: object, admin: object) => Promise<Response>} handler
 */
export function withAdmin(handler) {
  return async (req, ctx) => {
    let admin;
    try {
      admin = requireAdmin(req);
    } catch (err) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status || 401 },
      );
    }

    try {
      return await handler(req, ctx, admin);
    } catch (err) {
      console.error('[admin-api]', err);
      return NextResponse.json(
        { error: err.message || 'Server error' },
        { status: err.status || 500 },
      );
    }
  };
}
