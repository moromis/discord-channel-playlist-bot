import { identity } from "ramda";

const noLogger: Console = {
  ...console,
  info: identity,
  error: identity,
  log: identity,
};

console.log("debug: ", process.env.DEBUG);
console.log("local: ", process.env.LOCAL);

export const logger: Console = process.env.DEBUG ? console : noLogger;
