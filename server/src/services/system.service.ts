import os from "node:os";
import { statfs } from "node:fs/promises";
import osUtils from "os-utils";

export class SystemService {
  static async getStats() {
    const cpuUsage = await this.getCpuUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    let diskStats = { total: 0, free: 0, used: 0 };
    try {
      const stats = await statfs("/");
      diskStats.total = Number(stats.blocks) * Number(stats.bsize);
      diskStats.free = Number(stats.bavail) * Number(stats.bsize);
      diskStats.used = diskStats.total - diskStats.free;
    } catch (error) {
      console.error("Failed to get disk stats:", error);
    }

    return {
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        model: os.cpus()[0].model,
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentage: (usedMem / totalMem) * 100,
      },
      disk: {
        total: diskStats.total,
        used: diskStats.used,
        free: diskStats.free,
        percentage: (diskStats.used / diskStats.total) * 100,
      },
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
    };
  }

  static getCpuUsage() {
    return new Promise((resolve) => {
      osUtils.cpuUsage((value: number) => {
        resolve(value * 100);
      });
    });
  }
}
