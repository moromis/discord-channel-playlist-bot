import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import { Auth } from "../types/auth";
import { Config } from "../types/config";

const getConfig = (): Config => {
  return <Config>yaml.load(readFileSync("config.yml", "utf8"));
};

const getAuthConfig = (): Auth => {
  return <Auth>yaml.load(readFileSync("auth.yml", "utf8"));
};

export default {
  getConfig,
  getAuthConfig,
};
