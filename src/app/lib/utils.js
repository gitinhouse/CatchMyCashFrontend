import crypto from "crypto";

/**
 * Generate a strong random alphanumeric password
 * @param {number} length - desired password length (default: 10)
 * @returns {string}
 */
export function generateRandomPassword(length = 10) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
  const randomBytes = crypto.randomBytes(length);
  let password = "";

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}
