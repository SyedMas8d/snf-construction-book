import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { app } from './index';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running locally on http://localhost:${PORT}`);
});
