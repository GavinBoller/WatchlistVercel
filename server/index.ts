import express from 'express';
import session from 'express-session';
import watchlistRoutes from './watchlistRoutes';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true },
  })
);

app.use('/', watchlistRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
