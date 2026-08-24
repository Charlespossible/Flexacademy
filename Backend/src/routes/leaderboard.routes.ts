import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getLeaderboard } from "../controllers/leaderboard.controller";

const router = Router();
router.use(authenticate);

router.get("/", getLeaderboard);

export default router;
