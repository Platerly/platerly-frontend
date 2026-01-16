import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;

export const logger = {
  error: (message, error = null) => {
    if (isDev) {
      console.error(message, error);
    }
    if (error && !isDev) {
      Sentry.captureException(error, { extra: { message } });
    }
  },

  warn: (message, data = null) => {
    if (isDev) {
      console.warn(message, data);
    }
  },

  log: (message, data = null) => {
    if (isDev) {
      console.log(message, data);
    }
  },

  info: (message, data = null) => {
    if (isDev) {
      console.info(message, data);
    }
  }
};

export default logger;
