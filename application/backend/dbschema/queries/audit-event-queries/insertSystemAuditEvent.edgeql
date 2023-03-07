# Insert a system audit event.
with module audit
insert SystemAuditEvent {
  actionCategory := <optional ActionType>$actionCategory ?? ActionType.E,
  actionDescription := <optional str>$actionDescription ?? "",
  occurredDateTime := <optional datetime>$occurredDateTime ?? datetime_current(),
  outcome := <optional int16>$outcome ?? 0,
  details := <optional json>$details ?? {}
};
