import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditLogEvent, Database } from "../types/db";

export const recordAuditEvent = async (
  client: SupabaseClient<Database>,
  event: AuditLogEvent,
): Promise<void> => {
  const { error } = await client.from("audit_logs").insert({
    actor_id: event.actor_id,
    target_user_id: event.target_user_id,
    action: event.action,
    details: event.details,
  });

  if (error) {
    console.error("Failed to record audit event", error);
  }
};
