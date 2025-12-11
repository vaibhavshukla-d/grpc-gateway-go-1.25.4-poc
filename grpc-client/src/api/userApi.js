import httpClient from "./httpClient";

export const getUser = async (id) => {
  const res = await httpClient.get(`/users/${id}`);
  return res.data;
};
