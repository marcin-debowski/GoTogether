import { Router } from "express";
import { register, login, me, logout } from "../controllers/authController";
import { verifyLogin } from "../middleware/auth";
import { protect } from "../middleware/protect";

const router = Router();

router.post("/register", register);
router.post("/login", verifyLogin, login);
router.get("/me", protect, me);
router.post("/logout", logout);

export default router;
