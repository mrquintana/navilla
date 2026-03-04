package app.navilla.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.ConditionCatalogEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConditionCatalogRepository extends JpaRepository<ConditionCatalogEntry, UUID> {

  List<ConditionCatalogEntry> findByActiveTrueOrderByDisplayOrder();

  Optional<ConditionCatalogEntry> findByCode(String code);

  boolean existsByCodeAndActiveTrue(String code);
}
