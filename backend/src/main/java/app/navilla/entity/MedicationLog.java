package app.navilla.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "medication_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationLog {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "medication_id", nullable = false)
  private Medication medication;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Column(name = "logged_at", nullable = false)
  @Builder.Default
  private OffsetDateTime loggedAt = OffsetDateTime.now();

  @Column(name = "scheduled_for", nullable = false)
  private LocalDate scheduledFor;

  @Column(name = "taken", nullable = false)
  private Boolean taken;

  @Column(name = "notes_encrypted")
  private byte[] notesEncrypted;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
