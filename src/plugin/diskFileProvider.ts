import fs from 'fs';
import path from 'path';

import { Plugin, PrerenderInstance } from '@/instance';

export class DiskFileProvider implements Plugin {
	readonly name = 'DiscFileProvider';

	rootPath: string;
	constructor(rootPath: string) {
		this.rootPath = rootPath;
	}

	async execute(prerenderInstance: PrerenderInstance): Promise<void> {
		prerenderInstance.server.fileProvider = (filePath: string): Promise<string> => {
			return new Promise((resolve, reject) => {
				const fPath = path.resolve(this.rootPath, filePath);
				fs.readFile(fPath, (err, data) => {
					if (err !== null) {
						reject(err);
						return;
					}

					resolve(data.toString());
				});
			});
		};
	}
}
