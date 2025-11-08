import { type Request, type Response, Router } from 'express';
import { videoDownload, videoList, videoReplay } from '../controller/videoController';
const router = Router();

/* GET home page. */
router.get('/', function (req: Request, res: Response, next) {
    res.send("Hello from Node Express TS")
});

router.get("/list", videoList)
router.get("/replay", videoReplay)
router.get("/download", videoDownload)

export default router;