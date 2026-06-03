import jwt, { type SignOptions } from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET is required in backend/.env");
}

if (SECRET === "change-me" || SECRET.length < 24) {
  console.warn(
    "[boot] JWT_SECRET looks weak. Use a long random string (>= 32 chars) for production."
  );
}

export interface MedFlowToken {
  sub: string;     // profile id (uuid)
  email: string;
  role: "doctor" | "mr";
}

const EXPIRES_IN: SignOptions["expiresIn"] = "7d";

export function signToken(payload: MedFlowToken): string {
  return jwt.sign(payload, SECRET as string, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): MedFlowToken {
  const decoded = jwt.verify(token, SECRET as string);
  if (typeof decoded !== "object" || !decoded || typeof decoded.sub !== "string") {
    throw new Error("Invalid token payload");
  }
  return decoded as MedFlowToken;
}
