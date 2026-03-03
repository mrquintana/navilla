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

@Entity
@Table(name = "vaccinations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vaccination {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Column(name = "vaccine_type", nullable = false, length = 32)
  private String vaccineType;

  @Column(name = "dose_number", nullable = false)
  private Integer doseNumber;

  @Column(name = "total_doses", nullable = false)
  private Integer totalDoses;

  @Column(name = "administered_date", nullable = false)
  private LocalDate administeredDate;

  @Column(name = "location_encrypted")
  private byte[] locationEncrypted;

  @Column(name = "notes_encrypted")
  private byte[] notesEncrypted;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
