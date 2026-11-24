import { verifyJwt } from "deepspace/worker";

type AuthEnvironment = {
  AUTH_JWT_PUBLIC_KEY: string;
  AUTH_JWT_ISSUER: string;
};

export async function requireUser(
  request: Request,
  env: AuthEnvironment
): Promise<string> {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const outcome = await verifyJwt(
    {
      publicKey: env.AUTH_JWT_PUBLIC_KEY,
      issuer: env.AUTH_JWT_ISSUER,
    },
    token
  );

  if (!outcome.result) {
    throw new Error("Unauthorized");
  }

  return outcome.result.userId;
}
