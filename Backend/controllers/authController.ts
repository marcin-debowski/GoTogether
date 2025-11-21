import { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../utils/generateToken";

/**
 * Helper: ustawia podpisany JWT w ciasteczku httpOnly.
 * Cookie: 'jwt', httpOnly, secure (tylko w produkcji), sameSite (strict w prod, lax w dev), maxAge 7 dni.
 */
function setTokenCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dni
  });
}

/**
 * POST /api/auth/register
 * Input (JSON body): { name: string, email: string, password: string }
 * Output:
 *  - 201 { user: { id, name, email }, token }
 *  - 400 { message }
 *  - 409 { message }
 *  - 500 { message }
 * Uwaga: po sukcesie ustawia httpOnly cookie 'jwt' ważne 7 dni.
 */
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

/**
 * POST /api/auth/login
 * Wymaga wcześniejszego middleware (verifyLogin), który weryfikuje dane logowania i ustawia req.user.
 * Input: (body przetwarza verifyLogin; tutaj używamy req.user)
 * Output:
 *  - 200 { user: { id, name, email }, token }
 *  - 400 { message: "Brak użytkownika w kontekście" }
 *  - 500 { message }
 * Uwaga: po sukcesie ustawia httpOnly cookie 'jwt' ważne 7 dni.
 */
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

/**
 * GET /api/auth/me
 * Autoryzacja: wymaga middleware 'protect' (JWT z cookie/nagłówka), który ustawia req.user.
 * Output:
 *  - 200 { id, name, email }
 *  - 401 { message: "Nieautoryzowany" }
 */
export const me = async (req: Request, res: Response) => {
  // @ts-ignore
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Nieautoryzowany" });
  res.json({ id: user._id, name: user.name, email: user.email });
};

/**
 * POST /api/auth/logout
 * Działanie: czyści cookie 'jwt' (ustawia przeszłą datę wygaśnięcia).
 * Output:
 *  - 200 { message: "Wylogowano" }
 */
export const logout = async (_req: Request, res: Response) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.json({ message: "Wylogowano" });
};
