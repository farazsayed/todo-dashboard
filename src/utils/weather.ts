// Using Open-Meteo API (free, no API key required)
// https://open-meteo.com/

export interface WeatherData {
  temperature: number;
  condition: string;
  highTemp: number;
  lowTemp: number;
  windSpeed: number;
  windDirection: string;
  sunrise: string;
  sunset: string;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
}

// Get user's location using browser geolocation API
export async function getUserLocation(): Promise<GeoLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        // Default to San Francisco if location access denied
        resolve({
          latitude: 37.7749,
          longitude: -122.4194,
          city: 'San Francisco',
        });
      }
    );
  });
}

// Get weather data from Open-Meteo API
export async function getWeatherData(location: GeoLocation): Promise<WeatherData | null> {
  try {
    const { latitude, longitude } = location;

    // Fetch current weather and daily forecast with wind data
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=1`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();

    // Map weather codes to conditions
    const weatherCode = data.current.weather_code;
    const condition = getWeatherCondition(weatherCode);

    // Get wind direction as cardinal direction
    const windDirection = getWindDirection(data.current.wind_direction_10m);

    return {
      temperature: Math.round(data.current.temperature_2m),
      condition,
      highTemp: Math.round(data.daily.temperature_2m_max[0]),
      lowTemp: Math.round(data.daily.temperature_2m_min[0]),
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirection,
      sunrise: formatTime(data.daily.sunrise[0]),
      sunset: formatTime(data.daily.sunset[0]),
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

// Convert degrees to cardinal direction
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// Map WMO weather codes to human-readable conditions
function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

// Format ISO timestamp to time string
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Get weather emoji based on condition
export function getWeatherEmoji(condition: string): string {
  const lower = condition.toLowerCase();
  if (lower.includes('clear') || lower.includes('sunny')) return '☀️';
  if (lower.includes('partly')) return '⛅';
  if (lower.includes('cloudy')) return '☁️';
  if (lower.includes('rain')) return '🌧️';
  if (lower.includes('snow')) return '❄️';
  if (lower.includes('thunder')) return '⛈️';
  if (lower.includes('fog')) return '🌫️';
  if (lower.includes('drizzle')) return '🌦️';
  if (lower.includes('shower')) return '🌧️';
  return '🌤️';
}
