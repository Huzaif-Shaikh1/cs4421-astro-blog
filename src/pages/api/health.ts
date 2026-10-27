import type { APIRoute } from 'astro';

// Run this route on the server for every request (not pre-built at build time),
// so the uptime and timestamp are always live.
export const prerender = false;

export const GET: APIRoute = () => {
	return new Response(
		JSON.stringify({
			status: 'ok',
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		},
	);
};