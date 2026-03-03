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
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "reminders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reminder {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Column(name = "reminder_type", nullable = false, length = 32)
  private String reminderType;

  @Column(name = "reference_id")
  private UUID referenceId;

  @Column(name = "title_encrypted", nullable = false)
  private byte[] titleEncrypted;

  @Column(name = "message_encrypted")
  private byte[] messageEncrypted;

  @Column(name = "scheduled_for", nullable = false)
  private OffsetDateTime scheduledFor;

  @Column(name = "repeat_rule", length = 64)
  private String repeatRule;

  @Column(name = "snoozed_until")
  private OffsetDateTime snoozedUntil;

  @Column(name = "completed_at")
  private OffsetDateTime completedAt;

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
