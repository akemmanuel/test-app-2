    import { useState, useEffect } from "react";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { MapPin, RefreshCw, Cloud, Sun, CloudRain, Snowflake, Zap } from "lucide-react";
    import { Geolocation } from '@capacitor/geolocation';
    import "./index.css";

   interface WeatherData {
     current: {
       temperature: number;
       weatherCode: number;
       windSpeed: number;
       windDirection: number;
       time: string;
     };
     daily: {
       time: string[];
       temperatureMax: number[];
       temperatureMin: number[];
       weatherCode: number[];
       precipitationProbability: number[];
     };
     location: {
       name: string;
       latitude: number;
       longitude: number;
     };
   }

   export function App() {
     const [weather, setWeather] = useState<WeatherData | null>(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState("");

     const getWeatherIcon = (code: number) => {
       if (code === 0) return <Sun className="w-8 h-8 text-yellow-500" />;
       if (code >= 1 && code <= 3) return <Cloud className="w-8 h-8 text-gray-500" />;
       if (code >= 45 && code <= 48) return <Cloud className="w-8 h-8 text-gray-400" />;
       if (code >= 51 && code <= 67) return <CloudRain className="w-8 h-8 text-blue-500" />;
       if (code >= 71 && code <= 77) return <Snowflake className="w-8 h-8 text-blue-300" />;
       if (code >= 80 && code <= 82) return <CloudRain className="w-8 h-8 text-blue-600" />;
       if (code >= 85 && code <= 86) return <Snowflake className="w-8 h-8 text-blue-400" />;
       if (code >= 95 && code <= 99) return <Zap className="w-8 h-8 text-purple-600" />;
       return <Cloud className="w-8 h-8 text-gray-500" />;
     };

     const getWeatherDescription = (code: number) => {
       const descriptions: { [key: number]: string } = {
         0: "Klarer Himmel",
         1: "Überwiegend klar",
         2: "Teilweise bewölkt",
         3: "Bewölkt",
         45: "Nebel",
         48: "Raureif-Nebel",
         51: "Leichter Nieselregen",
         53: "Mäßiger Nieselregen",
         55: "Starker Nieselregen",
         56: "Leichter gefrierender Nieselregen",
         57: "Starker gefrierender Nieselregen",
         61: "Leichter Regen",
         63: "Mäßiger Regen",
         65: "Starker Regen",
         66: "Leichter gefrierender Regen",
         67: "Starker gefrierender Regen",
         71: "Leichter Schneefall",
         73: "Mäßiger Schneefall",
         75: "Starker Schneefall",
         77: "Schneekörner",
         80: "Leichte Regenschauer",
         81: "Mäßige Regenschauer",
         82: "Heftige Regenschauer",
         85: "Leichte Schneeschauer",
         86: "Starke Schneeschauer",
         95: "Leichtes Gewitter",
         96: "Gewitter mit Hagel",
         99: "Starkes Gewitter mit Hagel"
       };
       return descriptions[code] || "Unbekannt";
     };

     const fetchWeather = async (lat: number, lon: number, locationName: string = "") => {
       setLoading(true);
       setError("");

       try {
         const response = await fetch(
           `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
         );

         if (!response.ok) {
           throw new Error("Wetterdaten konnten nicht geladen werden");
         }

         const data = await response.json();

          setWeather({
            current: {
              temperature: data.current_weather.temperature,
              weatherCode: data.current_weather.weathercode,
              windSpeed: data.current_weather.windspeed,
              windDirection: data.current_weather.winddirection,
              time: data.current_weather.time
            },
            daily: {
              time: data.daily.time,
              temperatureMax: data.daily.temperature_2m_max,
              temperatureMin: data.daily.temperature_2m_min,
              weatherCode: data.daily.weather_code,
              precipitationProbability: data.daily.precipitation_probability_max
            },
            location: {
              name: locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
              latitude: lat,
              longitude: lon
            }
          });
       } catch (err) {
         setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
       } finally {
         setLoading(false);
       }
     };

        const getCurrentLocation = async () => {
          try {
            // Check permissions first
            const permissionStatus = await Geolocation.checkPermissions();
            console.log('Permission status:', permissionStatus);
            
            if (permissionStatus.location !== 'granted') {
              console.log('Requesting permissions...');
              const requestStatus = await Geolocation.requestPermissions();
              console.log('Request status:', requestStatus);
              if (requestStatus.location !== 'granted') {
                throw new Error("Standortberechtigung verweigert");
              }
            }

            console.log('Getting current position...');
            const position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            });
            console.log('Position:', position);
            
            const { latitude, longitude } = position.coords;
            await fetchWeather(latitude, longitude, "Aktueller Standort");
          } catch (err) {
            console.error('Geolocation error:', err);
            setError(`Standortfehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
            setLoading(false);
          }
        };

      // Load weather on mount using current location
      useEffect(() => {
        getCurrentLocation();
      }, []);

      return (
        <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          {/* Weather Display */}
          <div className="flex flex-col w-full max-w-md">
                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                      <p className="text-gray-600 text-sm">Lade Wetterdaten...</p>
                    </div>
                  ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center border border-red-200">
                        <MapPin className="w-6 h-6 text-red-400" />
                      </div>
                      <h3 className="text-base font-medium text-black">
                        Standort-Fehler
                      </h3>
                      <p className="text-red-600 text-sm max-w-xs">
                        {error}
                      </p>
                      <Button
                        onClick={getCurrentLocation}
                        className="mt-4 bg-black hover:bg-gray-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Erneut versuchen
                      </Button>
                    </div>
                  ) : weather ? (
                    <div className="flex-1 flex flex-col space-y-6">
                      {/* Current Weather */}
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center">
                          {getWeatherIcon(weather.current.weatherCode)}
                        </div>
                        <div className="text-4xl font-bold text-black">
                          {Math.round(weather.current.temperature)}°C
                        </div>
                        <p className="text-gray-600 text-sm">
                          {getWeatherDescription(weather.current.weatherCode)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Wind: {Math.round(weather.current.windSpeed)} km/h
                        </p>
                      </div>

                      {/* 7-Day Forecast */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-black text-sm">7-Tage-Vorhersage</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {weather.daily.time && weather.daily.weatherCode && weather.daily.temperatureMax && weather.daily.temperatureMin && weather.daily.precipitationProbability &&
                            weather.daily.time.slice(0, 7).map((date, index) => (
                              <div key={date} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div className="flex items-center gap-3">
                                  {getWeatherIcon(weather.daily.weatherCode[index] || 0)}
                                  <div>
                                    <p className="text-sm font-medium text-black">
                                      {new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {getWeatherDescription(weather.daily.weatherCode[index] || 0)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-black">
                                    {Math.round(weather.daily.temperatureMax[index] || 0)}° / {Math.round(weather.daily.temperatureMin[index] || 0)}°
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {weather.daily.precipitationProbability[index] || 0}% Regen
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          onClick={getCurrentLocation}
                          disabled={loading}
                          variant="outline"
                          className="border border-gray-300 text-black hover:bg-gray-50 text-sm"
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                          Aktualisieren
                        </Button>
                      </div>
                    </div>
                  ) : null}
          </div>
        </div>
      );
  }

  export default App;