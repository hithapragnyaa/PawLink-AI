
import axios from "axios";
import { getAccessToken } from "./api.js";

const API_BASE_URL =
  "https://qn5ni7slv3.execute-api.ap-south-1.amazonaws.com";

const teamsApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

teamsApi.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getResponseTeams = async () =>
  (await teamsApi.get("/teams")).data;

export const getResponseTeam = async (teamId) =>
  (await teamsApi.get(`/teams/${encodeURIComponent(teamId)}`)).data;

export const createResponseTeam = async (team) =>
  (await teamsApi.post("/teams", team)).data;

export const updateResponseTeam = async (teamId, updates) =>
  (
    await teamsApi.put(
      `/teams/${encodeURIComponent(teamId)}`,
      updates
    )
  ).data;

export const deleteResponseTeam = async (teamId) =>
  (
    await teamsApi.delete(
      `/teams/${encodeURIComponent(teamId)}`
    )
  ).data;
