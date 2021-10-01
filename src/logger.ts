import * as _ from "lodash";

const noLogger: Console = {
  ...console,
  info: _.noop,
  error: _.noop,
  log: _.noop,
};

console.log("debug: ", !!process.env.DEBUG);

export const logger: Console = process.env.DEBUG ? console : noLogger;
