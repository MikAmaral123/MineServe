import { net } from 'electron';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

export class ModrinthClient {
    private baseUrl = 'https://api.modrinth.com/v2';
    private userAgent = 'MineServe/1.2.0 (launcher)';

    constructor() { }

    async searchPlugins(query: string, limit: number = 20, filters: { type?: string, version?: string } = {}) {
        const facets: string[][] = [];

        // Type / Categories
        // Default: display both mods and plugins if unknown
        // If "vanilla", show nothing? No, maybe datapacks? Modrinth has datapacks.
        // Let's assume we map types:
        // fabric -> ["categories:fabric"] (mods)
        // paper/spigot -> ["categories:paper", "categories:bukkit", "categories:spigot"] (plugins)

        // Actually Modrinth separates project_type: mod vs plugin
        // But many mods are just "mod" category fabric.

        if (filters.type === 'fabric') {
            facets.push(["categories:fabric"]);
            facets.push(["project_type:mod"]);
        } else if (['paper', 'spigot', 'bukkit'].includes(filters.type || '')) {
            // Plugins
            facets.push(["project_type:plugin"]);
        } else {
            // Defaults if mixed or unknown, maybe exclude nothing or search both
            // If we want to be safe, stick to plugins as default if unsure? No.
            // Let's just default to "project_type:plugin" AND "project_type:mod" (OR logic)
            // facet: [["project_type:plugin", "project_type:mod"]]
            facets.push(["project_type:plugin", "project_type:mod"]);
        }

        // Version Logic
        if (filters.version) {
            facets.push([`versions:${filters.version}`]);
        }

        const serializedFacets = JSON.stringify(facets);
        const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&facets=${serializedFacets}&limit=${limit}`;

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': this.userAgent }
            });
            if (!response.ok) throw new Error(`Modrinth API error: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }

    async getLatestVersion(slug: string, loaders: string[] = ['paper', 'spigot', 'bukkit'], gameVersions?: string[]) {
        // Get versions for a project
        let url = `${this.baseUrl}/project/${slug}/version`;

        // Construct query params manually or verify if fetch supports URLSearchParams well in this env.
        // Let's stick to simple text construction for clarity.
        const params = new URLSearchParams();
        if (loaders.length > 0) params.append('loaders', JSON.stringify(loaders));
        if (gameVersions && gameVersions.length > 0) params.append('game_versions', JSON.stringify(gameVersions));

        url += `?${params.toString()}`;

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': this.userAgent }
            });
            if (!response.ok) throw new Error(`Modrinth Version API error: ${response.statusText}`);
            const versions = await response.json();
            return versions[0]; // Return the latest one
        } catch (error) {
            console.error('Get version failed:', error);
            throw error;
        }
    }

    async installPlugin(versionData: any, serverDir: string, serverType?: string) {
        if (!versionData || !versionData.files || versionData.files.length === 0) {
            throw new Error('No files found for this version');
        }

        const primaryFile = versionData.files.find((f: any) => f.primary) || versionData.files[0];
        const downloadUrl = primaryFile.url;
        const fileName = primaryFile.filename;

        // Use 'mods' folder for fabric/forge/quilt, 'plugins' for paper/spigot/bukkit
        const folderName = ['fabric', 'forge', 'quilt'].includes(serverType || '') ? 'mods' : 'plugins';
        const targetDir = path.join(serverDir, folderName);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const destPath = path.join(targetDir, fileName);

        // check if exists
        if (fs.existsSync(destPath)) {
            throw new Error('Plugin already installed (file exists)');
        }

        // Download
        const response = await fetch(downloadUrl, {
            headers: { 'User-Agent': this.userAgent }
        });

        if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

        if (!response.body) throw new Error('Response body is empty');

        const fileStream = fs.createWriteStream(destPath);
        // @ts-ignore - response.body is a ReadableStream in fetch API, readable in node 18+, but TS might complain depending on lib
        // Actually Electron main process Node environment supports stream.Readable.fromWeb (Node 16+) or simple piping?
        // Let's reuse the net module from electron or just standard node https if fetch is tricky with streams in this TS config.
        // But fetch in Node 18 returns a web stream. 'pipeline' from 'stream/promises' supports web streams.

        // @ts-ignore
        await pipeline(response.body, fileStream);

        return fileName;
    }
}
