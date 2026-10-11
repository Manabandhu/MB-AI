// Thin re-export of the app-wide helpers so existing imports keep working. `confirmAction` shows the shared
// ConfirmSheet; pass `{ destructive: true }` only for delete, cancel, and remove actions.
export { confirmAction, showError, showMessage } from '@/modules/shared/ui/notify';
