import { createHash } from "crypto";

import { SignUpWithUsernameAndPasswordError, type SignUpWithUsernameAndPasswordResult, } from "./+types";
import { prismaClient } from "../../extras/prisma";
import jwt from "jsonwebtoken";
import { jwtSecretKey } from "../../../environment";

const createJWToken = (parameters: { id: string; username: string }): string => {
  // Generate token
  const jwtPayload: jwt.JwtPayload = {
    iss: "https://purpleshorts.co.in",
    sub: parameters.id,
    username: parameters.username,
  };

  const token = jwt.sign(jwtPayload, jwtSecretKey, {
    expiresIn: "30d",
  });

  return token;
};

export const checkIfUserExistsAlready = async (parameters: { username: string }): Promise<boolean> => {
  const existingUser = await prismaClient.user.findUnique({
    where: {
      username: parameters.username,
    },
  });

  if (existingUser) {
    return true;
  }

  return false;
};

export const signUpWithUsernameAndPassword = async (parameters: {
  username: string;
  password: string;
}): Promise<SignUpWithUsernameAndPasswordResult> => {
  try {
    const isUserExistingAlready = await checkIfUserExistsAlready({
      username: parameters.username,
    });

    if (isUserExistingAlready) {
      throw SignUpWithUsernameAndPasswordError.CONFLICTING_USERNAME;
    }

    const passwordHash = createHash("sha256").update(parameters.password).digest("hex");

    const user = await prismaClient.user.create({
      data: {
        username: parameters.username,
        password: passwordHash,
      },
    });

    const token = createJWToken({
      id: user.id,
      username: user.username,
    });

    const result: SignUpWithUsernameAndPasswordResult = {
      token,
      user,
    };

    return result;
  } catch (e) {
    console.log("Error", e);
    throw SignUpWithUsernameAndPasswordError.UNKNOWN;
  }
};
