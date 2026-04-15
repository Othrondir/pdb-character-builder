/**
 * Data extractor configuration constants.
 *
 * All paths are build-time only and must never appear in compiled planner output.
 * The dataset-manifest.ts windowsAbsolutePathRegex guard prevents leakage.
 */

import path from 'node:path';

// ---------------------------------------------------------------------------
// nwsync database paths (D-01)
// ---------------------------------------------------------------------------

/** Root nwsync directory from the local NWN EE installation. */
export const NWSYNC_DIR = path.join(
  'C:',
  'Users',
  'pzhly',
  'Documents',
  'Neverwinter Nights',
  'nwsync',
);

/** nwsync metadata database (manifests and resource references). */
export const NWSYNC_META_DB = path.join(NWSYNC_DIR, 'nwsyncmeta.sqlite3');

/** nwsync data database (compressed resource blobs). */
export const NWSYNC_DATA_DB = path.join(NWSYNC_DIR, 'nwsyncdata_0.sqlite3');

// ---------------------------------------------------------------------------
// Base game paths (D-03, D-05)
// ---------------------------------------------------------------------------

/** Root directory of the Steam NWN EE installation. */
export const BASE_GAME_DIR = path.join(
  'C:',
  'Program Files (x86)',
  'Steam',
  'steamapps',
  'common',
  'Neverwinter Nights',
);

/** KEY file that indexes base-game BIF resources. */
export const BASE_GAME_KEY = path.join(BASE_GAME_DIR, 'data', 'nwn_base.key');

/** BIF file containing base-game 2DA resources. */
export const BASE_GAME_BIF_2DA = path.join(BASE_GAME_DIR, 'data', 'base_2da.bif');

/** Base game TLK file (Spanish locale, per D-05). */
export const BASE_GAME_TLK = path.join(
  BASE_GAME_DIR,
  'lang',
  'es',
  'data',
  'dialog.tlk',
);

// ---------------------------------------------------------------------------
// Puerta de Baldur server identifiers (RESEARCH Pitfall 4, D-04)
// ---------------------------------------------------------------------------

/** SHA1 hash of the Puerta de Baldur server manifest in nwsync. */
export const PUERTA_MANIFEST_SHA1 = 'cf6e8aad5751930e345266b84a3be31d9d67f3b1';

/** Resource reference for the custom Puerta TLK file. */
export const CUSTOM_TLK_RESREF = 'pb_tlk_v6';

/** nwsync resource type code for TLK files. */
export const CUSTOM_TLK_RESTYPE = 2018;

// ---------------------------------------------------------------------------
// NWN resource type codes
// ---------------------------------------------------------------------------

/** nwsync resource type code for 2DA files. */
export const RESTYPE_2DA = 2017;

/** nwsync resource type code for TLK files. */
export const RESTYPE_TLK = 2018;

// ---------------------------------------------------------------------------
// TLK string reference boundary (D-04, D-05)
// ---------------------------------------------------------------------------

/**
 * Custom TLK offset boundary. String references >= this value are resolved
 * against the custom Puerta TLK (actual index = strref - CUSTOM_TLK_OFFSET).
 * References below this value are resolved against the base game dialog.tlk.
 */
export const CUSTOM_TLK_OFFSET = 0x01000000; // 16777216

// ---------------------------------------------------------------------------
// Output paths (D-11)
// ---------------------------------------------------------------------------

/** Output directory for compiled TypeScript catalog files. */
export const OUTPUT_DIR = path.resolve('apps', 'planner', 'src', 'data');
