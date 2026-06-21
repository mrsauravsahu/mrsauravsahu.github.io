import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'local-photos',
			configureServer(server) {
				const photosDir = path.resolve(__dirname, '../../data-store/photos');
				server.middlewares.use('/photos', (req, res, next) => {
					const file = path.join(photosDir, req.url ?? '');
					if (fs.existsSync(file)) {
						res.setHeader('Cache-Control', 'public, max-age=3600');
						fs.createReadStream(file).pipe(res);
					} else {
						next();
					}
				});
			}
		}
	],
	server: {
		proxy: {
			'/api': 'http://localhost:30001',
			'/graphql': 'http://localhost:30001/graphql',
		}
	}
});
