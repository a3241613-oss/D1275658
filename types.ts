
export interface TripFormData {
  destination: string;
  startDate: string;
  endDate: string;
  arrivalTime: string;
  departureTime: string;
  accommodation: string;
  mustGo: string;
  notToGo: string;
  preference: 'relaxed' | 'normal' | 'packed';
  tripType: string;
}

export interface TripResponse {
  html: string;
  ics: string;
}
