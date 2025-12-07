import appConfig from "./app.config";
import authConfig from "./auth.config";
import databaseConfig from "./database.config";
import debugConfig from "./debug.config";
import helperConfig from "./helper.config";
import messageConfig from "./message.config";
import middlewareConfig from "./middleware.config";
import redisConfig from "./redis.config";
import resetPasswordConfig from "./reset-password.config";
import sessionConfig from "./session.config";
import settingConfig from "./setting.config";
import verificationConfig from "./verification.config";

const configs = [
  appConfig,
  authConfig,
  databaseConfig, 
  debugConfig,
  helperConfig,
  messageConfig,
  middlewareConfig,
  redisConfig,
  resetPasswordConfig,
  sessionConfig,
  settingConfig,
  verificationConfig
];

export default configs;