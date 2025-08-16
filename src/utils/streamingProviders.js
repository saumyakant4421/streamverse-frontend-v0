// Streaming provider mapping utility

// TMDB provider IDs to our frontend provider IDs mapping
export const TMDB_TO_FRONTEND_MAPPING = {
  8: 1,  // Netflix
  9: 2,  // Amazon Prime Video
  337: 3, // Disney+ Hotstar
  350: 4, // Apple TV+
  531: 5, // Paramount+
  386: 6, // Peacock
  15: 7,  // Hulu
  2: 1,   // Netflix (alternative ID)
  3: 2,   // Amazon Prime Video (alternative ID)
  119: 3, // Disney+ (alternative ID)
  31: 8,  // HBO Max/Max
  384: 8, // HBO Max/Max (alternative ID)
  1899: 8, // Max (new ID)
  1825: 8, // Max Amazon Channel
};

// Frontend provider IDs to TMDB provider IDs mapping
export const FRONTEND_TO_TMDB_MAPPING = {
  1: [8, 2],  // Netflix
  2: [9, 3],  // Amazon Prime Video
  3: [337, 119], // Disney+ Hotstar
  4: [350], // Apple TV+
  5: [531], // Paramount+
  6: [386], // Peacock
  7: [15],  // Hulu
  8: [31, 384, 1899, 1825], // Max (formerly HBO Max)
};

// Check if a provider is available based on the streaming data
export const isProviderAvailable = (providerId, streamingData) => {
  if (!streamingData || !streamingData.flatrate || !Array.isArray(streamingData.flatrate)) {
    return false;
  }
  
  // Get the TMDB IDs for this provider
  const tmdbIds = FRONTEND_TO_TMDB_MAPPING[providerId] || [];
  
  // Check if any of the TMDB IDs match with the available providers
  return streamingData.flatrate.some(provider => 
    tmdbIds.includes(provider.provider_id)
  );
};

// Get the provider URL from the streaming data
export const getProviderUrl = (providerId, streamingData, movieTitle) => {
  if (!streamingData) return null;
  
  // If we have a direct link from the API, use it
  if (streamingData.link) return streamingData.link;
  
  // If the service is available, try to find its specific URL from the API data
  if (streamingData.flatrate && Array.isArray(streamingData.flatrate)) {
    // Get the TMDB IDs for this provider
    const tmdbIds = FRONTEND_TO_TMDB_MAPPING[providerId] || [];
    
    // Find the matching provider from the API data
    const matchingProvider = streamingData.flatrate.find(provider => 
      tmdbIds.includes(provider.provider_id)
    );
    
    // If we found a matching provider with a URL, use it
    if (matchingProvider && matchingProvider.provider_url) {
      return matchingProvider.provider_url;
    }
  }
  
  // Fallback to search URLs if no direct link is available
  const fallbackUrls = {
    1: `https://www.netflix.com/search?q=${encodeURIComponent(movieTitle)}`,
    2: `https://www.primevideo.com/search/ref=atv_sr_sug_7?phrase=${encodeURIComponent(movieTitle)}`,
    3: `https://www.hotstar.com/in/search?q=${encodeURIComponent(movieTitle)}`,
    4: `https://tv.apple.com/search?term=${encodeURIComponent(movieTitle)}`,
    5: `https://www.paramountplus.com/search/?q=${encodeURIComponent(movieTitle)}`,
    6: `https://www.peacocktv.com/search?q=${encodeURIComponent(movieTitle)}`,
    7: `https://www.hulu.com/search?q=${encodeURIComponent(movieTitle)}`,
    8: `https://www.max.com/search?q=${encodeURIComponent(movieTitle)}` // Updated to Max URL
  };
  
  return fallbackUrls[providerId] || null;
}; 