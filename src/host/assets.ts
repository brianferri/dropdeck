import { memberGuard } from "@dropdeck/common";

export type PathFile = {
    path: string,
    file: File
};

const FILE_COUNT_MAX = 5000;
const DIRECTORY_BATCH_MAX = 1000;
const isMarkdownExtension = memberGuard([".md", ".markdown", ".mdown", ".mkd"]);

async function readEntriesOnce(reader: FileSystemDirectoryReader): Promise<Array<FileSystemEntry>> {
    return new Promise((resolve, reject) => { reader.readEntries(resolve, reject); });
}

async function readDirectory(directory: FileSystemDirectoryEntry): Promise<Array<FileSystemEntry>> {
    const reader = directory.createReader();
    const all: Array<FileSystemEntry> = [];
    // readEntries returns one batch per call; an empty batch signals the end.
    for (let batch = 0; batch < DIRECTORY_BATCH_MAX; batch += 1) {
        // eslint-disable-next-line no-await-in-loop -- A reader must be drained one batch at a time.
        const entries = await readEntriesOnce(reader);
        if (entries.length === 0) return all;
        for (const entry of entries) all.push(entry);
    }
    return all;
}

async function fileOf(entry: FileSystemFileEntry): Promise<File> {
    return new Promise((resolve, reject) => { entry.file(resolve, reject); });
}

// isFile/isDirectory are the only way to narrow a FileSystemEntry, so the matching cast is sound.
async function visit(entry: FileSystemEntry, found: Array<PathFile>): Promise<ReadonlyArray<FileSystemEntry>> {
    if (entry.isFile) {
        found.push({ path: entry.fullPath, file: await fileOf(entry as FileSystemFileEntry) });
        return [];
    }
    if (entry.isDirectory) return readDirectory(entry as FileSystemDirectoryEntry);
    return [];
}

async function walkEntries(roots: ReadonlyArray<FileSystemEntry>): Promise<Array<PathFile>> {
    const found: Array<PathFile> = [];
    const stack: Array<FileSystemEntry> = [];
    for (const root of roots) stack.push(root);
    while (stack.length > 0 && found.length < FILE_COUNT_MAX) {
        const entry = stack.pop();
        if (!entry) break;
        // eslint-disable-next-line no-await-in-loop -- The walk visits one node at a time against the live stack.
        for (const child of await visit(entry, found)) stack.push(child);
    }
    return found;
}

// The items must be read synchronously, before the first await voids the drop's item list.
export async function gatherDropFiles(transfer: DataTransfer): Promise<Array<PathFile>> {
    const roots: Array<FileSystemEntry> = [];
    for (const item of Array.from(transfer.items)) {
        const entry = item.webkitGetAsEntry();
        if (entry) roots.push(entry);
    }
    if (roots.length > 0) return walkEntries(roots);
    return Array.from(transfer.files).map((file) => ({ path: file.name, file }));
}

export function pickerFiles(list: FileList): Array<PathFile> {
    return Array.from(list).map((file) => ({ path: file.webkitRelativePath || file.name, file }));
}

function cleanPath(path: string): string {
    return path.startsWith("/") ? path.slice(1) : path;
}

export function basenameOf(path: string): string {
    const slash = path.lastIndexOf("/");
    return slash < 0 ? path : path.slice(slash + 1);
}

export function isMarkdown(path: string): boolean {
    const dot = path.lastIndexOf(".");
    if (dot < 0) return false;
    return isMarkdownExtension(path.slice(dot).toLowerCase());
}

export function directoryOf(path: string): string {
    const clean = cleanPath(path);
    const slash = clean.lastIndexOf("/");
    return slash < 0 ? "" : clean.slice(0, slash);
}

export function relativeTo(path: string, directory: string): string {
    const clean = cleanPath(path);
    if (directory === "") return clean;
    const prefix = `${directory}/`;
    return clean.startsWith(prefix) ? clean.slice(prefix.length) : clean;
}
