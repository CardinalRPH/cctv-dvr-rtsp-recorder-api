import cron from "node-cron";
import { getFilesSorted, getTotalSize } from "../utils/utils";
import fs from "fs/promises";
import variables from "../configs/variables";

const DEFAULT_MAX_DAYS = variables.MAX_DAYS;
const DEFAULT_MAX_BYTES = variables.MAX_STORAGE; // 16 GB

export function scheduleCleanup(dir: string, maxDays = DEFAULT_MAX_DAYS, maxBytes = DEFAULT_MAX_BYTES) {
    // Run at 03:00 local every day, and also every hour as safety
    cron.schedule("0 3 * * *", () => cleanup(dir, maxDays, maxBytes));
    cron.schedule("0 * * * *", () => cleanup(dir, maxDays, maxBytes)); // hourly safety
    // also run once now
    cleanup(dir, maxDays, maxBytes).catch(console.error);
}

async function cleanup(dir: string, maxDays: number, maxBytes: number) {
    try {
        const files = await getFilesSorted(dir); // sorted oldest -> newest

        // 1) Remove files older than maxDays (based on filename-date or mtime)
        const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
        for (const f of files) {
            if (f.mtimeMs < cutoff) {
                await fs.unlink(f.full);
                console.log("Deleted by age:", f.name);
            }
        }

        // Recompute files and size
        let curFiles = await getFilesSorted(dir);
        let total = curFiles.reduce((s, x) => s + x.size, 0);

        // 2) Enforce maxBytes: delete oldest until below threshold
        while (total > maxBytes && curFiles.length > 0) {
            const oldest = curFiles.shift()!;
            await fs.unlink(oldest.full);
            total -= oldest.size;
            console.log("Deleted by size:", oldest.name);
        }
    } catch (err) {
        console.error("Cleanup error:", err);
    }
}
