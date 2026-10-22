/**
 * Services for external APIs: Wikipedia Summary and Open-Meteo Weather.
 * No API keys required. All functions handle errors gracefully and never crash.
 */

/**
 * Truncates text at the last sentence boundary at or before maxLength characters.
 * Falls back to word boundary with ellipsis if no sentence boundary is found.
 *
 * @param {string} text - The input text to truncate.
 * @param {number} [maxLength=350] - Maximum desired character length.
 * @returns {string} Truncated string.
 */
export function truncateAtSentence(text, maxLength = 350) {
  if (!text || text.length <= maxLength) return text || ''

  const substring = text.slice(0, maxLength)
  // Find sentence terminators (. ! ?) followed by optional quote and space or end of string
  const matches = [...substring.matchAll(/[.!?]["'”’]?(?=\s|$)/g)]
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1]
    const boundaryIndex = lastMatch.index + lastMatch[0].length
    // Use boundary if it gives a reasonably informative extract (>= 60 chars)
    if (boundaryIndex >= 60) {
      return substring.slice(0, boundaryIndex).trim()
    }
  }

  // Fallback: truncate at last word boundary
  const lastSpace = substring.lastIndexOf(' ')
  if (lastSpace > 0) {
    return substring.slice(0, lastSpace).trim() + '...'
  }
  return substring.trim() + '...'
}

/**
 * Fetches an introductory summary of a topic from the Wikipedia REST API.
 *
 * @param {string} topic - The topic query to search for.
 * @returns {Promise<string>} Natural speakable summary or friendly fallback message.
 */
export async function fetchWikipediaSummary(topic) {
  if (!topic || !topic.trim()) {
    return "Please specify a topic to look up on Wikipedia."
  }

  const cleanTopic = topic.trim()
  const encodedTopic = encodeURIComponent(cleanTopic.replace(/\s+/g, '_'))
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTopic}`

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return `I couldn't find anything on Wikipedia for "${cleanTopic}".`
    }

    const data = await response.json()

    // Handle disambiguation pages
    if (data.type === 'disambiguation') {
      return `I couldn't find anything on Wikipedia for "${cleanTopic}".`
    }

    const extract = data.extract
    if (!extract || !extract.trim()) {
      return `I couldn't find anything on Wikipedia for "${cleanTopic}".`
    }

    return truncateAtSentence(extract.trim(), 350)
  } catch {
    return `I couldn't find anything on Wikipedia for "${cleanTopic}".`
  }
}

/**
 * Maps standard WMO weather codes to plain spoken descriptions.
 *
 * @param {number|string} code - The WMO numeric weather code.
 * @returns {string} Plain weather condition description.
 */
export function getWeatherDescription(code) {
  const numericCode = Number(code)
  switch (numericCode) {
    case 0:
      return 'clear skies'
    case 1:
      return 'mainly clear skies'
    case 2:
      return 'partly cloudy skies'
    case 3:
      return 'overcast skies'
    case 45:
    case 48:
      return 'foggy conditions'
    case 51:
    case 53:
    case 55:
      return 'drizzle'
    case 56:
    case 57:
      return 'freezing drizzle'
    case 61:
      return 'light rain'
    case 63:
      return 'moderate rain'
    case 65:
      return 'heavy rain'
    case 66:
    case 67:
      return 'freezing rain'
    case 71:
      return 'light snow'
    case 73:
      return 'moderate snow'
    case 75:
      return 'heavy snow'
    case 77:
      return 'snow grains'
    case 80:
    case 81:
    case 82:
      return 'rain showers'
    case 85:
    case 86:
      return 'snow showers'
    case 95:
      return 'thunderstorms'
    case 96:
    case 99:
      return 'thunderstorms with hail'
    default:
      return 'clear skies'
  }
}

/**
 * Fetches current weather for a city using Open-Meteo geocoding and forecast APIs.
 *
 * @param {string} [city='Hyderabad'] - City name.
 * @returns {Promise<string>} Natural spoken weather summary or friendly error string.
 */
export async function fetchWeather(city = 'Hyderabad') {
  const targetCity = (city || 'Hyderabad').trim()

  try {
    // 1. Geocode city name to coordinates
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      targetCity
    )}&count=1&language=en&format=json`

    const geoResponse = await fetch(geoUrl)
    if (!geoResponse.ok) {
      return `Sorry, I could not retrieve the weather for "${targetCity}" right now.`
    }

    const geoData = await geoResponse.json()
    if (!geoData.results || geoData.results.length === 0) {
      return `I couldn't find weather information for "${targetCity}".`
    }

    const location = geoData.results[0]
    const { latitude, longitude, name: resolvedName } = location

    // 2. Fetch current forecast from Open-Meteo
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`

    const forecastResponse = await fetch(forecastUrl)
    if (!forecastResponse.ok) {
      return `Sorry, I could not retrieve the weather for "${targetCity}" right now.`
    }

    const forecastData = await forecastResponse.json()
    const current = forecastData.current
    if (!current) {
      return `Sorry, I could not retrieve the weather for "${targetCity}" right now.`
    }

    const temp = Math.round(current.temperature_2m)
    const feelsLike = Math.round(current.apparent_temperature)
    const humidity = Math.round(current.relative_humidity_2m)
    const wind = Math.round(current.wind_speed_10m)
    const description = getWeatherDescription(current.weather_code)

    return `In ${resolvedName || targetCity} it is currently ${temp} degrees Celsius with ${description}. It feels like ${feelsLike} degrees, humidity is ${humidity} percent, and wind is ${wind} kilometers per hour.`
  } catch {
    return `Sorry, I could not retrieve the weather for "${targetCity}" right now.`
  }
}
