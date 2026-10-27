import type { APIRoute } from 'astro';

// Run this route on the server for every request (not pre-built at build time),
// so the uptime and timestamp are always live.
export const prerender = false;

export const GET: APIRoute = () => {
	return new Response(
		JSON.stringify({
			status: 'error',
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
		}),
		{
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		},
	);
};