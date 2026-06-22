# WebSocket Architecture

## Purpose

WebSockets provide low-latency operational updates without repeated polling.

Supported real-time scenarios:

- Queue updates.
- Appointment updates.
- Notification delivery.
- Doctor availability updates.
- Billing status updates.
- Presence tracking.
- Dashboard updates.

WebSockets are supplemental. REST APIs and MySQL remain the source of truth.

## Technology

- Socket.IO.
- JWT-based handshake authentication.
- Integrated API socket layer or dedicated socket server.
- Horizontal scaling through shared session store and shared event bus.

## Connection Lifecycle

1. Client connects.
2. Client sends access token in handshake.
3. Server verifies JWT signature, expiry, session, user status, clinic status, and token version.
4. Server resolves tenant.
5. Server loads roles and permissions.
6. Server assigns rooms.
7. Connection becomes active.
8. Heartbeat maintains health.
9. Disconnect cleans ephemeral presence.

Invalid connections are rejected and closed.

## Connection Context

Each socket stores immutable context:

- socketId.
- userId.
- clinicId.
- branchIds.
- roles.
- permissions.
- sessionId.
- connectedAt.
- lastSeen.

Connections cannot switch tenants. Reconnection requires reauthentication.

## Room Strategy

| Room | Pattern | Use |
| --- | --- | --- |
| Clinic | `clinic:{clinicId}` | Tenant-wide broadcasts. |
| Branch | `clinic:{clinicId}:branch:{branchId}` | Queue, branch dashboards, reception operations. |
| Doctor | `doctor:{doctorId}` | Doctor appointments, clinical updates, schedule updates. |
| User | `user:{userId}` | Personal notifications, session events, permission updates. |
| Role | `clinic:{clinicId}:role:{roleKey}` | Optional administrative broadcasts. |

Clients cannot self-select rooms. Room assignment is server-controlled after authentication and authorization.

## Event Categories

Queue events:

- queue.created.
- queue.called.
- queue.completed.
- queue.cancelled.
- queue.no_show.

Appointment events:

- appointment.created.
- appointment.updated.
- appointment.rescheduled.
- appointment.completed.
- appointment.cancelled.
- appointment.no_show.

Clinical events:

- consultation.started.
- consultation.completed.
- consultation.finalized.
- lab_report.published.
- prescription.finalized.

Billing events:

- invoice.created.
- invoice.finalized.
- payment.completed.
- refund.completed.

Notification events:

- notification.created.
- notification.sent.
- notification.failed.

Administrative events:

- user.updated.
- role.updated.
- settings.updated.
- subscription.updated.
- session.revoked.

## Broadcast Flow

1. Business action occurs through REST API.
2. Service writes data, audit log, and outbox event in transaction.
3. Transaction commits.
4. Event worker publishes domain event.
5. Socket publisher maps event to rooms.
6. Socket publisher validates tenant and permission rules.
7. Socket.IO broadcasts to rooms.
8. Clients refresh state through APIs where needed.

Events are never broadcast before commit.

## Payload Standards

Payload envelope:

```json
{
  "event": "queue.called",
  "resourceId": "uuid",
  "timestamp": "iso-date",
  "correlationId": "uuid",
  "payload": {}
}
```

Payload rules:

- No secrets.
- No passwords.
- No tokens.
- No sensitive session data.
- Minimal business data only.
- Include enough identifiers for client refresh.

## Authorization

Authorization applies to:

- Connection establishment.
- Room assignment.
- Event subscriptions if exposed.
- Client-originated socket messages if any are supported.

Recommended rule:

- Do not support business mutations through sockets in MVP.
- All business mutations go through REST APIs.
- Socket client messages should be limited to presence/acknowledgement where needed.

## Presence Tracking

Presence data:

- userId.
- clinicId.
- socketId.
- connectedAt.
- lastSeen.
- status: connected, active, idle, disconnected.

Presence is ephemeral and not business data.

## Session Synchronization

When session is revoked:

1. Auth/RBAC/User service emits session revocation event.
2. Socket registry finds sockets by sessionId or userId.
3. Server emits session revoked event to user room where appropriate.
4. Server disconnects matching sockets.
5. Client must reauthenticate.

Triggers:

- Logout all devices.
- Password reset.
- User deactivation.
- Critical role removal.
- Clinic suspension.
- Token reuse detection.

## Delivery Guarantees

Guarantee:

- Best-effort real-time delivery.

Rules:

- WebSockets are not guaranteed delivery.
- No critical workflow depends on socket delivery.
- Offline clients do not receive replay.
- Clients refresh state through REST APIs after reconnect.
- Database remains authoritative.

## Scaling Plan

Requirements:

- Shared session/token validation source.
- Shared event bus for multi-node socket publishing.
- Shared presence store if presence must span nodes.
- Sticky sessions optional, not required if adapter/event bus is configured.

Potential event bus:

- Redis adapter for Socket.IO.
- Queue/outbox worker publishing to all socket nodes.

## Rate Limiting

Protect:

- Connection rate.
- Handshake failures.
- Subscription attempts.
- Client message rate.
- Room count per connection.

Abuse responses:

- Reject connection.
- Disconnect socket.
- Audit security-relevant failures.

## Monitoring

Metrics:

- active connections.
- connection rate.
- failed authentications.
- disconnect rate.
- room counts.
- broadcast rate.
- message latency.
- event publish failures.

Auditable WebSocket events:

- connection created.
- connection rejected.
- authentication failure.
- permission failure.
- forced disconnect.
- administrative disconnect.

Routine broadcasts are not audited.

## Invariants

- Every connection is authenticated.
- Every connection resolves a tenant.
- Every room is tenant-scoped or resource-authorized.
- Clients cannot self-select rooms.
- Authorization applies to subscriptions.
- WebSockets never bypass APIs.
- WebSockets never become source of truth.
- Events publish only after transaction commit.
- Session revocation disconnects active sockets.
- Tenant isolation is enforced on every broadcast.

