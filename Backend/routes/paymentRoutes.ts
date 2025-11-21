import router from "./authRoutes";
import { protect } from "../middleware/protect";
import { addPayment, getBalances } from "../controllers/paymentController";

router.post("/:slug/addpayments", protect, addPayment);
router.get("/:slug/balances", protect, getBalances);

export default router;
