# Column Name Mismatch: kh_dkh vs kh_dgh
B003 | 2026-02-08 | Impact: MEDIUM | Status: RESOLVED | Domain: db

**Summary:** Validation schema used `kh_dkh` but database column is `kh_dgh`, causing insert failures.

**Details:** The Zod schema named the field `kh_dkh` (correct unit abbreviation) but the database migration used `kh_dgh`. API layer now maps between them.

**Action:** Added mapping in API layer: `kh_dgh: parameterData.kh_dkh`. Documented with code comment.

**Links:** File: `src/app/api/tanks/[tankId]/parameters/route.ts`
