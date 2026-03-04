package app.navilla.repository;

import java.util.List;
import java.util.UUID;

import app.navilla.entity.NetworkStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NetworkStageRepository extends JpaRepository<NetworkStage, UUID> {

  List<NetworkStage> findAllByOrderByDisplayOrder();
}
