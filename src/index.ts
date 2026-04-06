/**
 * PianoQuest Live — entry point.
 */

import "dotenv/config";
import { createApp } from "./agent/server.js";

const port = parseInt(process.env.PORT ?? "8090", 10);

const server = createApp();
server.listen(port, () => {
  console.log(`PianoQuest Live listening on port ${port}`);
});
