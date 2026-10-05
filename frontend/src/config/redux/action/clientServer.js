import axios from "axios";

const clientServer = axios.create({
  baseURL: "http://localhost:5000", 
});

export default clientServer;