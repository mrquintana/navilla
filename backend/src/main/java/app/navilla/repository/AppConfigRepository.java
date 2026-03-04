package app.navilla.repository;

import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.AppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppConfigRepository extends JpaRepository<AppConfig, UUID> {

  Optional<AppConfig> findByConfigKey(String configKey);
}
