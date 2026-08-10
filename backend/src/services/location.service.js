import axios from 'axios';
import { config } from '../config/env.js';
import { AppError } from '../shared/response.js';

export class LocationService {
  constructor(apiKey) {
    this.apiKey = apiKey || config.TOMTOM_API_KEY || process.env.TOMTOM_API_KEY;
  }

  /**
   * Geocodes an address string using ONLY TomTom Geocoding API.
   * Throws AppError.badRequest if address is invalid/unrecognized or TomTom API call fails.
   */
  async geocodeAddress(addressString) {
    if (!addressString || typeof addressString !== 'string' || !addressString.trim()) {
      throw AppError.badRequest('A valid non-empty address string is required for geocoding.');
    }

    const cleanAddress = addressString.trim();

    if (!this.apiKey) {
      throw AppError.badRequest('TomTom API key is not configured in backend environment variables.');
    }

    try {
      const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(cleanAddress)}.json?key=${this.apiKey}&limit=1`;
      const response = await axios.get(url, { timeout: 10000 });

      const results = response.data?.results;
      if (!results || !Array.isArray(results) || results.length === 0) {
        throw AppError.badRequest(`Address could not be recognized by TomTom Geocoding: "${cleanAddress}". Please specify a valid location address.`);
      }

      const position = results[0]?.position;
      if (!position || typeof position.lat !== 'number' || typeof position.lon !== 'number') {
        throw AppError.badRequest(`TomTom Geocoding returned invalid position data for address: "${cleanAddress}".`);
      }

      const addressData = results[0]?.address;
      const formattedAddress = addressData?.freeformAddress || cleanAddress;

      return {
        address: formattedAddress,
        latitude: position.lat,
        longitude: position.lon,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      const errorMsg = error.response?.data?.errorText || error.message || 'TomTom Geocoding request failed';
      throw AppError.badRequest(`TomTom Geocoding error for address "${cleanAddress}": ${errorMsg}`);
    }
  }

  /**
   * Extension stubs for future phases
   */
  async reverseGeocode(latitude, longitude) {
    throw AppError.badRequest('Reverse geocoding will be enabled in Phase 2.');
  }

  async calculateRoute(origin, destination) {
    throw AppError.badRequest('Routing calculation will be enabled in Phase 2.');
  }
}

export const locationService = new LocationService();
