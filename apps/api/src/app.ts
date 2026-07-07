import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(express.json());

  app.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/health/ready', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ready' });
  });

  return app;
}
