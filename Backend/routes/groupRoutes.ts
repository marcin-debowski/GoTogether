import { protect } from "../middleware/protect";
import {
  addMemberToGroup,
  createGroup,
  listGroups,
  membersList,
  removeMember,
} from "../controllers/groupController";
import router from "./authRoutes";

router.post("/create", protect, createGroup);
router.post("/:slug/members", protect, addMemberToGroup);
router.get("/list", protect, listGroups);
router.get("/:slug/members", protect, membersList);
router.delete("/:slug/members/:memberId", protect, removeMember);

export default router;
