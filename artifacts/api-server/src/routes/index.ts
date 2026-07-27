import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import storageRouter from "./storage";
import mobileRouter from "./mobile";
import authRouter from "./auth";
import bannersRouter from "./banners";
import websiteContentRouter from "./websiteContent";
import settingsRouter from "./settings";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(adminRouter);
router.use(authRouter);
router.use(bannersRouter);
router.use(websiteContentRouter);
router.use(settingsRouter);
router.use(reviewsRouter);
router.use(mobileRouter);

export default router;
