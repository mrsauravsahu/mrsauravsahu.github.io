import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const photosDir = path.resolve(__dirname, '../../data-store/photos');

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'local-photos',
			// Dev: serve photos from data-store via middleware
			configureServer(server) {
				server.middlewares.use('/photos', (req, res, next) => {
					const file = path.join(photosDir, req.url ?? '');
					if (fs.existsSync(file)) {
						res.setHeader('Cache-Control', 'public, max-age=3600');
						fs.createReadStream(file).pipe(res);
					} else {
						next();
					}
				});
			},
			// Build: copy photos into the static output so /photos/* resolves
			closeBundle() {
				const outPhotosDir = path.resolve(__dirname, 'build/photos');
				if (fs.existsSync(photosDir)) {
					fs.cpSync(photosDir, outPhotosDir, { recursive: true });
				}
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
