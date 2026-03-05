package app.navilla.entity;

import java.time.LocalDate;
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
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "test_visits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestVisit {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Column(name = "test_date", nullable = false)
  private LocalDate testDate;

  @Column(name = "lab_id")
  private UUID labId;

  @Column(name = "lab_reference_encrypted")
  private byte[] labReferenceEncrypted;

  @Column(name = "notes_encrypted")
  private byte[] notesEncrypted;

  @Column(name = "raw_lab_response_encrypted")
  private byte[] rawLabResponseEncrypted;

  @Column(name = "verified", nullable = false)
  @Builder.Default
  private Boolean verified = false;

  @Column(name = "verified_at")
  private OffsetDateTime verifiedAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
