import { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../utils/generateToken";

function setTokenCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dni
  });
}

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Wymagane: name, email, password" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Użytkownik już istnieje" });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).trim(),
      password,
    });
    const anyUser: any = user; // cast for _id access
    const token = generateToken(anyUser._id.toString());
    setTokenCookie(res, token);
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error("Register error", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

// POST /api/auth/login
// Wymaga wcześniejszego middleware verifyLogin, które ustawia req.user
export const login = async (req: Request, res: Response) => {
  // @ts-ignore dodane przez verifyLogin
  const user = req.user as any | undefined;
  if (!user) {
    return res.status(400).json({ message: "Brak użytkownika w kontekście" });
  }
  try {
    const token = generateToken((user as any)._id.toString());
    setTokenCookie(res, token);
    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

// GET /api/auth/me
export const me = async (req: Request, res: Response) => {
  // @ts-ignore
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Nieautoryzowany" });
  res.json({ id: user._id, name: user.name, email: user.email });
};

// POST /api/auth/logout
export const logout = async (_req: Request, res: Response) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.json({ message: "Wylogowano" });
};
