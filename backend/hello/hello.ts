import { api } from "encore.dev/api";
import log from "encore.dev/log";
import { getAuthData } from "~encore/auth";

interface Response {
  message: string;
}

export const get = api(
  {
    auth: false,
    expose: false,
    method: 'GET',
    path: '/hello',
  },
  async (): Promise<Response> => {
    return { message: 'nihao' }
  }
);

export const admin = api(
  {
    auth: true, // Require the user to be authenticated
    expose: true,
    method: "GET",
    path: "/admin",
  },
  async (): Promise<Response> => {
    const userID = getAuthData()!.userID;
    log.info("Data requested by user", { userID });

    return { message: "Secret message for admins" };
  },
);