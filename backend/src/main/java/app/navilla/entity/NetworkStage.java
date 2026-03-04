package app.navilla.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "network_stages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NetworkStage {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "code", nullable = false, unique = true, length = 50)
  private String code;

  @Column(name = "display_name", nullable = false, length = 100)
  private String displayName;

  @Column(name = "display_name_es", length = 100)
  private String displayNameEs;

  @Column(name = "min_nodes", nullable = false)
  private Integer minNodes;

  @Column(name = "max_nodes")
  private Integer maxNodes;

  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  @Column(name = "description_es", columnDefinition = "TEXT")
  private String descriptionEs;

  @Column(name = "display_order", nullable = false)
  @Builder.Default
  private Integer displayOrder = 0;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
