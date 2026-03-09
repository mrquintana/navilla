export interface LabProviderConfig {
  code: string;
  name: string;
  nameEs: string;
  requiredFields: LabFieldConfig[];
}

export interface LabFieldConfig {
  key: string;
  label: string;
  labelEs: string;
}

export interface LabTestResultDto {
  patientName: string | null;
  testDate: string;
  conditionCode: string;
  result: string;
  resultValue: string | null;
  referenceRange: string | null;
  labReferenceId: string | null;
}

export interface LabVerifyResponse {
  success: boolean;
  visitId?: string;
  results?: LabTestResultDto[];
  errorCode?: string;
  errorMessage?: string;
}

export interface LabVerifyRequest {
  visitId?: string;
  testDate?: string;
  labCode: string;
  visitCredentials: Record<string, string>;
  labCredentials?: Record<string, string>;
}

export interface LabConfirmRequest {
  visitId: string;
}
