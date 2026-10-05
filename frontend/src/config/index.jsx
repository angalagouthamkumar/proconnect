const axios = require('axios');



export const baseURL = 'http://localhost:5000/';
const clientServer = axios.create({
  baseURL: baseURL
});