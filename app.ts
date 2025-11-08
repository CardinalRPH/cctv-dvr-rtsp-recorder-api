import express, { json, urlencoded, static as static_ } from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import dotenv from "dotenv";
import videoRouter from "./src/routes/videoRouter";
import path from "path";
import variables from "./src/configs/variables";
import { ensureDir } from "./src/utils/utils";
import { startDailyRecorder } from "./src/services/recorder";
import { scheduleCleanup } from "./src/services/cleanup";

dotenv.config();

const RECORD_DIR = path.join(process.cwd(), "recordings");
const RTSP_URL = variables.RTSP_URL

ensureDir(RECORD_DIR)

startDailyRecorder(RTSP_URL, RECORD_DIR)

scheduleCleanup(RECORD_DIR)

const app = express();

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", videoRouter);

export default app;