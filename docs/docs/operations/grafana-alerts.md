# Grafana/Loki Alert Rules

Navilla emits structured log events for rate limiting and resource cap hits. These LogQL queries can be configured as Grafana alert rules.

## Rate Limit Alerts

### High write volume from single user (>100 writes/hour)

```logql
sum by (user) (count_over_time({app="navilla"} |= "Rate limit exceeded" | logfmt | user != "" [1h])) > 100
```

### High request volume from single IP (>1000 requests/hour)

```logql
sum by (ip) (count_over_time({app="navilla"} |= "Rate limit exceeded" | logfmt [1h])) > 1000
```

## Resource Cap Alerts

### Any resource cap hit (investigate for abuse patterns)

```logql
{app="navilla"} |= "Resource cap reached"
```

## Authentication Alerts

### Auth failures (potential brute force)

```logql
sum(count_over_time({app="navilla"} |= "401" [15m])) > 50
```

## Log Event Formats

Rate limit events use this format:
```
Rate limit exceeded: user={userKey} path={path} method={method} retryAfter={seconds}s
```

Resource cap events use this format:
```
Resource cap reached: type={resourceType} count={count} cap={cap}
```

## Configuration

These alerts should be configured in Grafana with appropriate notification channels (Slack, email). Set evaluation intervals to 5 minutes for rate limit alerts and 1 hour for resource cap alerts.
