import exifr from 'exifr'

export interface LocationData {
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  country?: string
}

export async function extractLocationFromImage(file: File): Promise<LocationData | null> {
  try {
    // Extract GPS data from EXIF
    const exifData = await exifr.gps(file)
    
    if (!exifData || !exifData.latitude || !exifData.longitude) {
      return null
    }

    const locationData: LocationData = {
      latitude: exifData.latitude,
      longitude: exifData.longitude
    }

    // Optionally, reverse geocode to get address (would require additional API)
    // For now, just return GPS coordinates
    
    return locationData
  } catch (error) {
    console.log('Failed to extract EXIF location:', error)
    return null
  }
}

export async function extractAllExifData(file: File): Promise<any> {
  try {
    const exifData = await exifr.parse(file, {
      // Include common tags
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      ihdr: true,
      gps: true
    })
    
    return exifData
  } catch (error) {
    console.log('Failed to extract EXIF data:', error)
    return null
  }
}

export function formatLocation(location: LocationData): string {
  if (location.address) {
    return location.address
  }
  
  if (location.latitude && location.longitude) {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
  }
  
  return 'Location unknown'
}