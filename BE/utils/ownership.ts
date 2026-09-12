import { HttpError } from './httpError';
import { Role } from './jwt';

// Shared by any "you can only modify what you created" rule — admins bypass it,
// everyone else must be the recorded owner of the entry.
export function assertOwnerOrAdmin(
  user: { id: string; role: Role },
  ownerId: unknown,
  message = 'You can only modify entries you created'
): void {
  if (user.role === 'admin') {
    return;
  }
  if (!ownerId || ownerId.toString() !== user.id) {
    throw new HttpError(403, message);
  }
}
