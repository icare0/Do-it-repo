import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService } from './locationService';

const WEATHER_CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  condition: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'mist';
  sunrise: Date;
  sunset: Date;
  advice?: string;
}

export interface WeatherForecast {
  date: Date;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
}

class WeatherService {
  // Using OpenMeteo - Free, no API key required
  private baseUrl = 'https://api.open-meteo.com/v1';

  async getCurrentWeather(latitude?: number, longitude?: number): Promise<WeatherData | null> {
    try {
      // Check cache first
      const cached = await this.getCachedWeather();
      if (cached) return cached;

      // Get current location if not provided
      let lat = latitude;
      let lon = longitude;

      if (!lat || !lon) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          lat = location.coords.latitude;
          lon = location.coords.longitude;
        } else {
          // Default to Paris
          lat = 48.8566;
          lon = 2.3522;
        }
      }

      const url = `${this.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = await response.json();
      const current = data.current;
      const daily = data.daily;

      const weatherCode = current.weather_code;
      const condition = this.getConditionFromCode(weatherCode);
      const description = this.getDescriptionFromCode(weatherCode);

      const weather: WeatherData = {
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        description,
        icon: this.getIconFromCondition(condition),
        windSpeed: Math.round(current.wind_speed_10m),
        condition,
        sunrise: new Date(daily.sunrise[0]),
        sunset: new Date(daily.sunset[0]),
        advice: this.getWeatherAdvice(condition, current.temperature_2m),
      };

      // Cache the result
      await this.cacheWeather(weather);

      return weather;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  }

  async getForecast(latitude?: number, longitude?: number, days: number = 7): Promise<WeatherForecast[]> {
    try {
      let lat = latitude;
      let lon = longitude;

      if (!lat || !lon) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          lat = location.coords.latitude;
          lon = location.coords.longitude;
        } else {
          lat = 48.8566;
          lon = 2.3522;
        }
      }

      const url = `${this.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${days}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Weather forecast API request failed');
      }

      const data = await response.json();
      const daily = data.daily;

      return daily.time.map((date: string, index: number) => ({
        date: new Date(date),
        tempMin: Math.round(daily.temperature_2m_min[index]),
        tempMax: Math.round(daily.temperature_2m_max[index]),
        condition: this.getDescriptionFromCode(daily.weather_code[index]),
        icon: this.getIconFromCondition(this.getConditionFromCode(daily.weather_code[index])),
      }));
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return [];
    }
  }

  private getConditionFromCode(code: number): WeatherData['condition'] {
    // WMO Weather interpretation codes
    if (code === 0 || code === 1) return 'clear';
    if (code >= 2 && code <= 3) return 'clouds';
    if (code >= 45 && code <= 48) return 'mist';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 85 && code <= 86) return 'snow';
    if (code >= 95 && code <= 99) return 'thunderstorm';
    return 'clouds';
  }

  private getDescriptionFromCode(code: number): string {
    const descriptions: { [key: number]: string } = {
      0: 'Ciel dégagé',
      1: 'Principalement dégagé',
      2: 'Partiellement nuageux',
      3: 'Nuageux',
      45: 'Brouillard',
      48: 'Brouillard givrant',
      51: 'Bruine légère',
      53: 'Bruine modérée',
      55: 'Bruine dense',
      61: 'Pluie légère',
      63: 'Pluie modérée',
      65: 'Pluie forte',
      71: 'Neige légère',
      73: 'Neige modérée',
      75: 'Neige forte',
      77: 'Grains de neige',
      80: 'Averses légères',
      81: 'Averses modérées',
      82: 'Averses violentes',
      85: 'Averses de neige légères',
      86: 'Averses de neige fortes',
      95: 'Orage',
      96: 'Orage avec grêle légère',
      99: 'Orage avec grêle forte',
    };
    return descriptions[code] || 'Conditions variables';
  }

  private getIconFromCondition(condition: WeatherData['condition']): string {
    const icons: { [key: string]: string } = {
      clear: 'sunny',
      clouds: 'cloudy',
      rain: 'rainy',
      snow: 'snow',
      thunderstorm: 'thunderstorm',
      mist: 'cloudy',
    };
    return icons[condition] || 'cloudy';
  }

  private getWeatherAdvice(condition: WeatherData['condition'], temp: number): string {
    if (condition === 'rain' || condition === 'thunderstorm') {
      return 'Prends un parapluie !';
    }
    if (condition === 'snow') {
      return 'Habille-toi chaudement, il neige !';
    }
    if (temp < 5) {
      return 'Il fait très froid, couvre-toi bien !';
    }
    if (temp > 30) {
      return 'Canicule ! Reste hydraté.';
    }
    if (condition === 'clear' && temp > 20) {
      return 'Belle journée pour sortir !';
    }
    return '';
  }

  private async getCachedWeather(): Promise<WeatherData | null> {
    try {
      const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_DURATION) {
        return null;
      }

      return {
        ...data,
        sunrise: new Date(data.sunrise),
        sunset: new Date(data.sunset),
      };
    } catch {
      return null;
    }
  }

  private async cacheWeather(data: WeatherData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        WEATHER_CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error caching weather:', error);
    }
  }
}

export const weatherService = new WeatherService();
