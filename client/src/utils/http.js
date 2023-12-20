import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const queryClient = new QueryClient();

export const signUpHelper = async ({ formData }) => {
  const response = await axios.post("/api/signup", formData);
  return response.data;
};

export const signInHelper = async ({ formData }) => {
  const response = await axios.post("/api/signin", formData);
  return response.data;
};

export const createWhatsappServer = async () => {
  const response = await axios.get("/api/createSession");
  return response.statusText;
};

export const getMessages = async () => {
  const response = await axios.get("/api");
  return response.data;
};

export const allMessages = async () => {
  try {
    const response = await axios.get("/api/refreshMessages");
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await axios.post("/api/logout");
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const newTag = async ({ formData }) => {
  const response = await axios.post("/api/tag/add", formData);
  return response.data;
};

export const delTag = async ({ formData }) => {
  const response = await axios.post("/api/tag/del", formData);
  return response.data;
};
