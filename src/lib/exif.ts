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
    console.log('=== METADATA EXTRACTION DEBUG ===')
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type)
    console.log('Last modified:', new Date(file.lastModified))
    
    // First, let's get ALL available metadata to see what's there
    try {
      const allMetadata = await exifr.parse(file, {
        // Extract everything possible
        xmp: true,
        icc: true, 
        iptc: true,
        jfif: true,
        ihdr: true,
        gps: true,
        tiff: true,
        exif: true,
        // Include all possible tags
        pick: undefined // Don't filter anything
      })
      console.log('=== ALL AVAILABLE METADATA ====')
      console.log(JSON.stringify(allMetadata, null, 2))
      
      // List all available keys
      if (allMetadata) {
        console.log('Available metadata keys:', Object.keys(allMetadata))
        
        // Look for any GPS-related fields
        const gpsKeys = Object.keys(allMetadata).filter(key => 
          key.toLowerCase().includes('gps') || 
          key.toLowerCase().includes('lat') || 
          key.toLowerCase().includes('lon') ||
          key.toLowerCase().includes('location') ||
          key.toLowerCase().includes('position')
        )
        console.log('GPS-related keys found:', gpsKeys)
        
        // Show values for GPS keys
        gpsKeys.forEach(key => {
          console.log(`${key}:`, allMetadata[key])
        })
      }
    } catch (allMetaError) {
      console.log('Failed to extract all metadata:', allMetaError)
    }
    
    // Extract GPS data from EXIF - try multiple approaches
    let exifData
    try {
      exifData = await exifr.gps(file)
      console.log('GPS data from exifr.gps:', exifData)
    } catch (gpsError) {
      console.log('GPS extraction failed, trying full parse:', gpsError)
      // Fallback to full EXIF parse
      const fullExif = await exifr.parse(file, { gps: true })
      console.log('Full EXIF data with GPS:', fullExif)
      exifData = fullExif
    }
    
    if (!exifData) {
      console.log('❌ No EXIF data found at all')
      return null
    }

    // Try different GPS field formats
    let lat = exifData.latitude || exifData.GPSLatitude
    let lon = exifData.longitude || exifData.GPSLongitude
    
    if (!lat || !lon) {
      console.log('❌ No GPS coordinates found in EXIF data')
      console.log('Available EXIF fields:', exifData ? Object.keys(exifData) : 'none')
      return null
    }

    console.log('✅ Found GPS coordinates:', lat, lon)
    console.log('Latitude type:', typeof lat, 'Longitude type:', typeof lon)

    const locationData: LocationData = {
      latitude: lat,
      longitude: lon
    }

    // Try to reverse geocode using a free service
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      )
      
      if (response.ok) {
        const geoData = await response.json()
        console.log('✅ Reverse geocoding result:', geoData)
        
        if (geoData.locality || geoData.city) {
          locationData.city = geoData.locality || geoData.city
        }
        
        if (geoData.countryName) {
          locationData.country = geoData.countryName
        }
        
        // Build a readable address
        const addressParts = []
        if (geoData.locality) addressParts.push(geoData.locality)
        if (geoData.principalSubdivision) addressParts.push(geoData.principalSubdivision)
        if (geoData.countryName) addressParts.push(geoData.countryName)
        
        if (addressParts.length > 0) {
          locationData.address = addressParts.join(', ')
        }
      }
    } catch (geocodeError) {
      console.log('Reverse geocoding failed:', geocodeError)
      // Still return GPS coordinates even if reverse geocoding fails
    }
    
    return locationData
  } catch (error) {
    console.error('Failed to extract EXIF location:', error)
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