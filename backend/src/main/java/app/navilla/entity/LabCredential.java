package app.navilla.entity;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "lab_credentials",
    uniqueConstraints = @UniqueConstraint(columnNames = {"lab_id", "credential_key"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabCredential {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "lab_id", nullable = false)
  private UUID labId;

  @Column(name = "credential_key", nullable = false, length = 64)
  private String credentialKey;

  @Column(name = "value_encrypted", nullable = false)
  private byte[] valueEncrypted;
}
