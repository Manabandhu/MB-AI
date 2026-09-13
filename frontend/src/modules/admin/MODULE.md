# Admin

Owns Dashboard, Users, Reports, Rooms/Rides/Community/Jobs/Events Moderation, Audit Log, and the typed automation API client. It never stores infrastructure credentials or executes arbitrary commands.

## Component Inventory

- `frontend/src/modules/admin/api.ts` - Typed API client for admin operations (automations, users, reports, rooms, rides, community, jobs, events, audit log).
- `frontend/src/modules/admin/screens/AdminDashboardScreen.tsx` - Admin overview and metrics.
- `frontend/src/modules/admin/screens/AdminUsersScreen.tsx` - Manage users.
- `frontend/src/modules/admin/screens/AdminReportsScreen.tsx` - View and manage reports.
- `frontend/src/modules/admin/screens/AdminRoomsScreen.tsx` - Moderate room listings.
- `frontend/src/modules/admin/screens/AdminRidesScreen.tsx` - Moderate rides.
- `frontend/src/modules/admin/screens/AdminCommunityScreen.tsx` - Moderate community content.
- `frontend/src/modules/admin/screens/AdminJobsScreen.tsx` - Moderate job postings.
- `frontend/src/modules/admin/screens/AdminEventsScreen.tsx` - Moderate events.
- `frontend/src/modules/admin/screens/AdminAuditLogScreen.tsx` - System audit log.
