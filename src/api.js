import axios from "axios";

// URL de ton backend Railway
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const getContacts = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/contacts`);
  return res.data;
};
