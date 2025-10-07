import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";

export async function verifyLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ message: "Email i hasło są wymagane" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Nieprawidłowe dane logowania" });
    }

    // @ts-ignore metoda dostępna na instancji
    const passwordMatches = await user.matchPassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Nieprawidłowe dane logowania" });
    }

    // Możesz usunąć hasło z obiektu zanim podasz dalej
    // @ts-expect-error password jest select:true lokalnie
    delete user.password;

    // Podpinamy użytkownika do requestu, aby kontroler końcowy mógł z niego skorzystać
    // (Rozszerz typ Request w deklaracji globalnej jeśli chcesz pełne typowanie)
    // @ts-ignore
    req.user = user;

    next();
  } catch (err) {
    console.error("Błąd w verifyLogin:", err);
    return res.status(500).json({ message: "Błąd serwera" });
  }
}
