const axios = require('axios');
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
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: {
        api_key: apiKey,
        query: title,
        year: year,
        language: 'es-ES'
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        tmdbId: result.id,
        title: result.title || result.name,
        description: result.overview,
        rating: result.vote_average.toFixed(1),
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
