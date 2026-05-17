# TODO

## Project Versioning
- Adopt semantic versioning (major.minor.patch) and document the policy
- Tag releases in git and maintain a CHANGELOG
- Expose the current version in the `/healthz` response for runtime visibility
- Version the API URL (already at `/v1/`) and define a deprecation policy for future versions

## RBAC
- Define roles (e.g. read-only consumer, admin)
- Validate inbound `Authorization` header (JWT or API key)
- Map token claims to roles and enforce per-route
- Propagate a scoped credential to the upstream service rather than forwarding the client token directly

## Healthcheck
- Add `GET /healthz` endpoint returning `200 OK` so the container orchestrator can verify the app is running
- Wire it into the `Dockerfile` as a `HEALTHCHECK` instruction
- Document the endpoint in the user guide

## Backend Monitoring
- Add structured request logging (method, path, status, latency)
- Emit metrics for upstream XML fetch duration and error rate
- Set up alerting on sustained `502` error rates
