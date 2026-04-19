import { validateEnvironment } from "./config.ts";

validateEnvironment({ includeCron: true });
console.log("⚙️ Environment configuration looks good.");
