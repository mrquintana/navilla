package app.navilla.entity;

import java.time.LocalDate;
import java.time.LocalTime;
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
@Table(name = "medications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Medication {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Column(name = "medication_type", nullable = false, length = 32)
  private String medicationType;

  @Column(name = "name_encrypted", nullable = false)
  private byte[] nameEncrypted;

  @Column(name = "dosage_encrypted")
  private byte[] dosageEncrypted;

  @Column(name = "start_date", nullable = false)
  private LocalDate startDate;

  @Column(name = "end_date")
  private LocalDate endDate;

  @Column(name = "frequency", nullable = false, length = 32)
  private String frequency;

  @Column(name = "reminder_time")
  private LocalTime reminderTime;

  @Column(name = "notes_encrypted")
  private byte[] notesEncrypted;

  @Column(name = "active", nullable = false)
  @Builder.Default
  private Boolean active = true;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
