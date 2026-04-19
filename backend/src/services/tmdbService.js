const db = require('../config/db');

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

const getApiKey = () => {
  const config = db.prepare("SELECT value FROM system_config WHERE key = 'tmdb_api_key'").get();
  return config ? config.value : null;
};

const searchMedia = async (title, year, type = 'movie') => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const endpoint = type === 'series' ? '/search/tv' : '/search/movie';
    const params = new URLSearchParams({
      api_key: apiKey,
      query: title,
      year: (year || '').toString(),
      language: 'es-ES'
    });

    const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`);
    if (!response.ok) return null;
    
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        tmdbId: result.id,
        title: result.title || result.name,
        description: result.overview,
        rating: (result.vote_average || 0).toFixed(1),
        year: (result.release_date || result.first_air_date || '').split('-')[0],
        posterPath: result.poster_path ? `${IMAGE_BASE_URL}${result.poster_path}` : null,
        bannerPath: result.backdrop_path ? `${BACKDROP_BASE_URL}${result.backdrop_path}` : null
      };
    }
    return null;
  } catch (error) {
    console.error('TMDB Search Error:', error.message);
    return null;
  }
};

module.exports = { searchMedia };
