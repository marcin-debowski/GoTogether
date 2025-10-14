import { protect } from "../middleware/protect";
import { addMemberToGroup, createGroup } from "../controllers/groupController";
import router from "./authRoutes";

router.post("/create", protect, createGroup);
router.post("/:slug/members", protect, addMemberToGroup);

export default router;
