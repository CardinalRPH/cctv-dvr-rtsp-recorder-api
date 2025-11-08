import ffmpeg from "fluent-ffmpeg";
import path from "path";
import ffmpegPath  from "@ffmpeg-installer/ffmpeg"
import { ensureDir } from "../utils/utils";

ffmpeg.setFfmpegPath(ffmpegPath.path)

const SEGMENT_SECONDS = 86400; // 1 day
const STRFTIME_PATTERN = "%Y-%m-%d.mp4";

export function startDailyRecorder(rtspUrl: string, outDir: string) {
    // ensure folder exists
    ensureDir(outDir).catch(console.error);

    // Build ffmpeg command via fluent-ffmpeg.
    // We use segment muxer + strftime to produce one file per day named YYYY-MM-DD.mp4
    function spawnFfmpeg() {
        const outputPattern = path.join(outDir, STRFTIME_PATTERN);

        console.log("Starting ffmpeg recorder, output:", outputPattern);

        // fluent-ffmpeg wrapper
        const cmd = ffmpeg(rtspUrl)
            .inputOptions(["-rtsp_transport", "tcp", "-stimeout", "2000000"]) // tcp + connect timeout
            .outputOptions([
                "-c", "copy",                 // copy codecs (no re-encode)
                "-map", "0",
                "-f", "segment",
                "-segment_time", String(SEGMENT_SECONDS),
                "-reset_timestamps", "1",
                "-strftime", "1",
                // make MP4 streamable while recording
                "-movflags", "frag_keyframe+empty_moov"
            ])
            .output(outputPattern);

        // Start - fluent-ffmpeg spawns ffmpeg process internally
        cmd.on("start", (commandLine: string) => {
            console.log("FFmpeg started:", commandLine);
        });

        cmd.on("stderr", (stderrLine: string) => {
            // verbose FFmpeg logs
            console.log("[ffmpeg]", stderrLine);
        });

        cmd.on("error", (err: Error) => {
            console.error("FFmpeg error:", err.message);
            setTimeout(spawnFfmpeg, 2000);
        });

        cmd.on("end", () => {
            console.log("FFmpeg ended, will restart...");
            setTimeout(spawnFfmpeg, 2000);
        });

        // run (this returns a fluent-ffmpeg object; process is internal)
        try {
            cmd.run();
        } catch (e) {
            console.error("Failed to run ffmpeg wrapper:", e);
            setTimeout(spawnFfmpeg, 2000);
        }
    }

    // start first time
    spawnFfmpeg();
}
