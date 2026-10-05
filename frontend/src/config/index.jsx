const axios = require('axios');



export const baseURL = process.env.NEXT_PUBLIC_API_URL;
const clientServer = axios.create({
  baseURL: baseURL
});