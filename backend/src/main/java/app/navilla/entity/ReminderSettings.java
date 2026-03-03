package app.navilla.entity;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "reminder_settings",
    uniqueConstraints = @UniqueConstraint(
        name = "reminder_settings_user_hash_key",
        columnNames = {"user_hash"}
    )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderSettings {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Column(name = "quiet_hours_start")
  private LocalTime quietHoursStart;

  @Column(name = "quiet_hours_end")
  private LocalTime quietHoursEnd;

  @Column(name = "email_digest_enabled", nullable = false)
  @Builder.Default
  private Boolean emailDigestEnabled = false;

  @Column(name = "email_digest_day", length = 12)
  private String emailDigestDay;

  @Column(name = "testing_reminders_enabled", nullable = false)
  @Builder.Default
  private Boolean testingRemindersEnabled = true;

  @Column(name = "medication_reminders_enabled", nullable = false)
  @Builder.Default
  private Boolean medicationRemindersEnabled = true;

  @Column(name = "vaccination_reminders_enabled", nullable = false)
  @Builder.Default
  private Boolean vaccinationRemindersEnabled = true;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
