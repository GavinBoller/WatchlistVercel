import express from 'express';
import cors from 'cors';
import { authRouter } from './authRoutes';
import { apiRouter } from './routes';
import { jwtRouter } from './jwtAuthRoutes';
import { statusRouter } from './statusRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);
app.use('/api/jwt', jwtRouter);
app.use('/api/status', statusRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});