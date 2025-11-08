import fs from "fs/promises";
import path from "path";

export async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

export async function getFilesSorted(dir: string) {
    const names = await fs.readdir(dir);
    const arr = await Promise.all(
        names.map(async (name) => {
            const full = path.join(dir, name);
            const st = await fs.stat(full);
            return { name, full, mtimeMs: st.mtimeMs, size: st.size, isFile: st.isFile() };
        })
    );
    return arr.filter(x => x.isFile).sort((a, b) => a.mtimeMs - b.mtimeMs);
}

export async function getTotalSize(dir: string) {
    const files = await getFilesSorted(dir);
    return files.reduce((s, f) => s + f.size, 0);
}
