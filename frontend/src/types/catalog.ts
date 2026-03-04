export interface ConditionCatalogItem {
  code: string;
  displayName: string;
  displayNameEs: string;
  description: string | null;
  descriptionEs: string | null;
  icon: string | null;
  displayOrder: number;
}

export interface NetworkStage {
  code: string;
  displayName: string;
  displayNameEs: string;
  minNodes: number;
  maxNodes: number | null;
  description: string | null;
  descriptionEs: string | null;
}
