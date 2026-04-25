// @ts-ignore generated at build time
import { createApp } from "../dist/api-app.js";

const app = createApp();

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}
