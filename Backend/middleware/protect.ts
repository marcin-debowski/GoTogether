import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Cookie (jwt)
    // @ts-ignore
    if (req.cookies && req.cookies.jwt) {
      // @ts-ignore
      token = req.cookies.jwt;
    }

    // 2. Fallback: Authorization: Bearer <token>
    if (!token) {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith("Bearer ")) {
        token = auth.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Brak tokenu" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Brak JWT_SECRET" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: string;
      iat: number;
      exp: number;
    };

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Użytkownik nie istnieje" });

    // @ts-ignore
    req.user = user;
    next();
  } catch (err) {
    console.error("Protect error", err);
    return res.status(401).json({ message: "Nieautoryzowany" });
  }
}
