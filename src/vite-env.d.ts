// The exported deck's standalone presenter, bundled to an IIFE string by a Vite plugin at build time.
declare module "virtual:present-runtime" {
    const code: string;
    export default code;
}
