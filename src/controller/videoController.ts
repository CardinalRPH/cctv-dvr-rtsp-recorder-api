import { type Response, type Request } from "express";
import fs from "fs"
import variables from "../configs/variables";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { getFilesSorted } from "../utils/utils";

export const videoList = async (_req: Request, res: Response) => {
    const files = await getFilesSorted(variables.DIR);
    res.json(files.map(f => f.name));
}

export const videoReplay = (req: Request, res: Response) => {
    const date = String(req.query.date || "");
    if (!date) return res.status(400).send("Missing date (YYYY-MM-DD)");

    const filename = `${date}.mp4`;
    const full = path.join(variables.DIR, filename);
    if (!fs.existsSync(full)) return res.status(404).send("File not found");

    const time = String(req.query.time || ""); // "HH:MM:SS" optional

    if (!time) {
        // stream raw file (no seek) — good for full-day playback
        res.setHeader("Content-Type", "video/mp4");
        const stream = fs.createReadStream(full);
        stream.on("error", (err) => {
            console.error("Stream error:", err);
            res.end();
        });
        stream.pipe(res);
        return;
    }

    // If time specified, use ffmpeg to seek and output mp4 streamable
    // convert HH:MM:SS to seconds
    const parts = time.split(":").map(Number);
    if (parts.some(isNaN)) return res.status(400).send("Invalid time format (use HH:MM:SS)");
    const seconds = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);

    // Use fluent-ffmpeg: seekInput then copy codecs to avoid re-encode
    res.setHeader("Content-Type", "video/mp4");

    // Important output options for streaming:
    // -c copy (copy codecs), -movflags frag_keyframe+empty_moov (make mp4 streamable)
    const proc = ffmpeg(full)
        .seekInput(seconds)
        .outputOptions(["-c", "copy", "-movflags", "frag_keyframe+empty_moov"])
        .format("mp4")
        .on("start", (cmdline: string) => {
            console.log("Start ffmpeg stream:", cmdline);
        })
        .on("error", (err: Error) => {
            console.error("ffmpeg stream error:", err.message);
            if (!res.headersSent) res.status(500).send("Stream error");
            try { res.end(); } catch { }
        })
        .on("end", () => {
            console.log("ffmpeg stream ended");
            try { res.end(); } catch { }
        });

    // pipe to http response
    const stream = proc.pipe();
    stream.on("error", (e: any) => {
        console.error("pipe error:", e);
    });
    stream.pipe(res);

}

export const videoDownload = (req: Request, res: Response) => {
    const date = String(req.query.date || "");
    if (!date) return res.status(400).send("Missing date");
    const file = path.join(variables.DIR, `${date}.mp4`);
    if (!fs.existsSync(file)) return res.status(404).send("Not found");
    res.download(file);

}