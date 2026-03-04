export interface PhoneMatchNotification {
  id: string;
  entryId: string;
  location: string | null;
  encounterDate: string | null;
  maskedPhone: string | null;
  createdAt: string;
}
