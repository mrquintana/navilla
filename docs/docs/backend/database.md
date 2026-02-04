---
sidebar_position: 4
title: Database
---

# Database

PostgreSQL database configuration and access patterns.

## Configuration

### Connection

```yaml
# application.yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
```

### Migrations

Using Flyway for schema migrations. Migration files are located in the `database/migrations/` directory:

```
database/migrations/
├── 001_initial_schema.sql
├── 002_row_level_security.sql
└── 003_functions.sql
```

## Schema

See [Data Model](../architecture/data-model) for full schema definition.

## Repository Layer

```java
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailHash(String emailHash);

    boolean existsByEmailHash(String emailHash);
}

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, UUID> {

    @Query("""
        SELECT c FROM Connection c
        WHERE (c.userAHash = :userHash OR c.userBHash = :userHash)
        AND c.status = 'CONFIRMED'
    """)
    List<Connection> findConfirmedConnectionsForUser(String userHash);

    @Query("""
        SELECT c FROM Connection c
        WHERE c.userBHash = :userHash
        AND c.status = 'PENDING'
    """)
    List<Connection> findPendingRequestsForUser(String userHash);
}
```

## Graph Queries

For exposure calculation, complex graph traversal logic often utilizes native SQL queries for performance. The following example demonstrates a recursive CTE to find connected users up to a certain degree. This type of query would typically be embedded within a service layer component responsible for exposure calculations.

```java
@Query(nativeQuery = true, value = """
    WITH RECURSIVE connection_graph AS (
        -- Base case: direct connections
        SELECT
            user_b_hash as connected_user,
            1 as degree
        FROM connections
        WHERE user_a_hash = :userHash
        AND status = 'confirmed'

        UNION

        SELECT
            user_a_hash as connected_user,
            1 as degree
        FROM connections
        WHERE user_b_hash = :userHash
        AND status = 'confirmed'

        UNION ALL

        -- Recursive case: connections of connections
        SELECT
            CASE
                WHEN c.user_a_hash = cg.connected_user THEN c.user_b_hash
                ELSE c.user_a_hash
            END as connected_user,
            cg.degree + 1 as degree
        FROM connections c
        JOIN connection_graph cg ON
            (c.user_a_hash = cg.connected_user OR c.user_b_hash = cg.connected_user)
        WHERE c.status = 'confirmed'
        AND cg.degree < :maxDegree
    )
    SELECT DISTINCT connected_user, MIN(degree) as degree
    FROM connection_graph
    GROUP BY connected_user
""")
List<Object[]> findConnectionGraphForUser(String userHash, int maxDegree);
```

## Connection Pooling

Using HikariCP with Supabase:

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```
