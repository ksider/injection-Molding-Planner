import "dotenv/config";
import { createApp } from "./app.js";

const app = createApp();
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`IM-DOE Planner running on http://localhost:${PORT}`);
});
