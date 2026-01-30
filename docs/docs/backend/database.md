---
sidebar_position: 4
title: Database
---

# Database

PostgreSQL database configuration and access patterns.

:::note Work in Progress
Implementation details will be added as the backend is built.
:::

## Configuration

### Connection

```yaml
# application.yml
spring:
  datasource:
    url: ${DATABASE_URL}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
```

### Migrations

Using Flyway for schema migrations:

```
src/main/resources/db/migration/
├── V1__initial_schema.sql
├── V2__add_indexes.sql
└── V3__add_rls_policies.sql
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

For exposure calculation, we use native queries for performance:

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
