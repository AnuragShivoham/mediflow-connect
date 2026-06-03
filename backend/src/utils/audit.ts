import { sql } from '../lib/db';

export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldData?: unknown,
  newData?: unknown
): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
      VALUES (
        ${userId},
        ${action},
        ${entityType},
        ${entityId},
        ${oldData ? JSON.stringify(oldData) : null},
        ${newData ? JSON.stringify(newData) : null}
      )
    `;
  } catch (err) {
    // Audit failures should never crash the main request
    console.error('[audit] Failed to write audit log:', err);
  }
}
