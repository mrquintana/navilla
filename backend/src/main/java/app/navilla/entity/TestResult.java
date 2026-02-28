package app.navilla.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "test_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestResult {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "visit_id", nullable = false)
  private UUID visitId;

  @Enumerated(EnumType.STRING)
  @Column(name = "condition_type", length = 32)
  private ConditionType conditionType;

  @Column(name = "custom_condition_encrypted")
  private byte[] customConditionEncrypted;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private TestResultStatus status;

  @Column(name = "result_value_encrypted")
  private byte[] resultValueEncrypted;

  @Column(name = "reference_range", length = 200)
  private String referenceRange;

  @Column(name = "cleared_at")
  private OffsetDateTime clearedAt;

  @Column(name = "document_ref_encrypted")
  private byte[] documentRefEncrypted;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
