import axios from "axios";

const clientServer = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL;
});

export default clientServer;