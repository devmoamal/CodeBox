import { StorageService } from "./storage.service";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "@/lib/logger";
import { env } from "@/config/env.config";
import { resolve } from "node:path";

const execPromise = promisify(exec);

export type SearchResult = {
  path: string;
  line: number;
  text: string;
  type: 'content' | 'file';
};

export class SearchService {
  /**
   * Search for a pattern in both file content and filenames.
   */
  static async search(
    projectId: string,
    query: string,
    options: {
      matchCase?: boolean;
      wholeWord?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    logger.info(`Search: "${query}" in project ${projectId} (Match Case: ${options.matchCase}, Whole Word: ${options.wholeWord})`);

    // Run both searches in parallel
    const [contentResults, fileResults] = await Promise.all([
      this.searchContent(projectId, query, options),
      this.searchFilenames(projectId, query, options)
    ]);

    logger.info(`Search results: ${fileResults.length} files matched, ${contentResults.length} lines matched`);
    
    // Merge and sort: File matches first, then content matches
    return [...fileResults, ...contentResults];
  }

  private static async searchContent(
    projectId: string,
    query: string,
    options: { matchCase?: boolean; wholeWord?: boolean }
  ): Promise<SearchResult[]> {
    const projectPath = resolve(env.STORAGE_PATH, projectId);

    // Construct grep flags
    let flags = "-rnIE"; 
    if (!options.matchCase) flags += "i";
    if (options.wholeWord) flags += "w";
    
    // Pattern escaping
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Exclude noise
    const excludes = "--exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next";
    
    // We use a relative path for grep but provide projectRoot as CWD
    const command = `/usr/bin/grep ${flags} ${excludes} "${escapedQuery}" .`;

    try {
      const { stdout } = await execPromise(command, { cwd: projectPath });
      return this.parseGrepOutput(stdout);
    } catch (error: any) {
      if (error.code === 1) return []; // No matches
      logger.error(`Content search error: ${error.message} (CWD: ${projectPath})`);
      return [];
    }
  }

  private static async searchFilenames(
    projectId: string,
    query: string,
    options: { matchCase?: boolean }
  ): Promise<SearchResult[]> {
    try {
      const allFiles = await StorageService.listAllByProjectId(projectId);
      const q = options.matchCase ? query : query.toLowerCase();

      logger.info(`Checking filename matches in ${allFiles.length} files...`);

      const matches = allFiles
        .filter(f => !f.is_folder)
        .filter(f => {
          const name = options.matchCase ? f.name : f.name.toLowerCase();
          return name.includes(q);
        })
        .map(f => ({
          path: f.path,
          line: 0,
          text: `File: ${f.name}`,
          type: 'file' as const
        }));

      if (matches.length > 0) {
        logger.info(`Matched filenames: ${matches.map(m => m.path).join(', ')}`);
      }

      return matches;
    } catch (error: any) {
      logger.error(`Filename search error: ${error.message}`);
      return [];
    }
  }

  private static parseGrepOutput(stdout: string): SearchResult[] {
    const lines = stdout.split("\n").filter(Boolean);
    const results: SearchResult[] = [];

    for (const line of lines) {
      // Grep output format: [path]:[line]:[text]
      // Handle both "./path" and "path"
      const match = line.match(/^(\.\/)?(.+):(\d+):(.*)$/);
      if (match) {
        const [_, dotSlash, relativePath, lineNumber, text] = match;
        results.push({
          path: relativePath,
          line: parseInt(lineNumber, 10),
          text: text.trim(),
          type: 'content'
        });
      }
    }

    return results;
  }
}
