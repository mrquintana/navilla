export interface ReciprocityStatus {
  optedIn: boolean;
  optedInAt: string | null;
  optedOutAt: string | null;
  cooldownDaysRemaining: number | null;
}
