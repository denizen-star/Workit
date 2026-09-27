/** Client-safe device-block constants (no jose / DB), shared by pages and server code. */

/** localStorage mirror of the block cookie; a backup marker the join page checks on mount. */
export const DEVICE_BLOCK_STORAGE_KEY = 'workit-device-block';

/** The root admin (user id 1) can never be blocked. */
export const UNBLOCKABLE_USER_ID = 1;
