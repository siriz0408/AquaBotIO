# Bugs Index

> Active: 1 | Resolved: 16 | Last updated: 2026-02-10

Naming: `B{NNN}-{kebab-title}.md`

| ID | Severity | Status | Domain | Title | Assigned To |
|----|----------|--------|--------|-------|-------------|
| B023-4 | P0 | PENDING VERIFICATION | storage | Tank photos bucket missing in remote Supabase | Backend |
| B024-1 | P1 | RESOLVED | ui/css | All dashboard pages left-justified, not centered | Frontend |
| B024-2 | P1 | RESOLVED | ui/chat | AI chat code flash during streaming (incomplete blocks visible) | Frontend |
| B024-3 | P1 | RESOLVED | api/chat | AI chat requires tank — blocks users without tanks | Backend |
| B024-4 | P1 | RESOLVED | api/actions | Schedule task action fails due to AI payload format mismatch | Backend |
| B023-1 | P0 | RESOLVED | ui/api | Notification settings not saving extended preferences | Frontend |
| B023-2 | P0 | RESOLVED | db/api | Admin hook uses wrong table name (admin_profiles vs admin_users) | Backend |
| B023-3 | P0 | RESOLVED | ui | Tank context not refreshed after onboarding creation | Frontend |
| B014 | P1 | RESOLVED | config | Security headers blocking static assets (nosniff on _next/static) | PM |
| B005 | P0 | RESOLVED | auth | Supabase auth Web Lock deadlock (noOpLock workaround) | Backend |
| B006 | P1 | RESOLVED | auth | Middleware blocks /api/auth/* routes | Backend |
| B004 | P2 | RESOLVED | db | Column name mismatch water_parameters vs parameter_thresholds | Backend |
| B007 | P2 | RESOLVED | db | Log page kh_dkh → kh_dgh column mapping | Backend |
| B008 | P2 | RESOLVED | ui | Temperament type mismatch semi-aggressive vs semi_aggressive | Frontend |
| B001 | P2 | RESOLVED | ui | Parameter chart Y-axis edge case | Frontend |
| B002 | P3 | RESOLVED | ui | Parameter log missing saltwater fields | Frontend |
| B003 | P2 | RESOLVED | db | Column name mismatch kh_dkh vs kh_dgh | Backend |

<!-- PM: P0/P1 bugs always at the top. Cross-link to mistakes/ when root cause is found. -->
