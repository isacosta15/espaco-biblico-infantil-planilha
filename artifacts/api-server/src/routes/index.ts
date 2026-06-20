import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import congregationsRouter from "./congregations";
import childrenRouter from "./children";
import attendanceRouter from "./attendance";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(congregationsRouter);
router.use(childrenRouter);
router.use(attendanceRouter);
router.use(reportsRouter);

export default router;
