/**
 * Side-effect module, imported first by server.ts.
 *
 * ES imports are hoisted, so a bare `validateEnv()` call placed between import
 * statements would still run *after* every module had loaded — including the
 * ones that read process.env at module scope. Putting the check inside an
 * imported module makes it run in source order instead, which is the only way
 * to guarantee it happens before anything else touches the environment.
 */
import "dotenv/config";
import { validateEnv } from "./utils/validateEnv";

validateEnv();
