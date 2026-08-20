/** Strava's SummaryActivity shape (subset of fields Ritmo consumes), as returned by the activities-list endpoint. */
export interface StravaSummaryActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_speed: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  has_heartrate?: boolean;
  average_cadence?: number;
  total_elevation_gain?: number;
  start_latlng?: [number, number] | null;
  workout_type?: number | null;
  athlete?: { id: number };
}

/** Strava's DetailedActivity shape, as returned by the single-activity endpoint; extends the summary with a few extra fields. */
export interface StravaDetailedActivity extends StravaSummaryActivity {
  calories?: number;
  description?: string | null;
}

/** Strava's Lap shape, as returned by the activity-laps endpoint. */
export interface StravaLap {
  id: number;
  lap_index: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  total_elevation_gain?: number;
}

/** Strava's OAuth token response, as returned by the code-exchange and refresh-token endpoints. */
export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number; firstname?: string; lastname?: string };
}
