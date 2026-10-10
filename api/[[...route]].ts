// Vercel entry: every /api/* request goes to the Hono app in server/.
// Only files in api/ become Vercel functions, so the app code lives outside it.
import { app } from "../server/app";

export const GET = (req: Request) => app.fetch(req);
export const POST = (req: Request) => app.fetch(req);
