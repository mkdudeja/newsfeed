import { Options } from "../../../library/reconnecting-websocket";

export function getPropertyValue<T = any>(
  object: Record<string, any>,
  propertyPath: string,
  defaultValue: any = null
): T {
  return doesObjectContainProperty(object, propertyPath)
    ? (propertyPath.split(".").reduce((previous, current) => {
        return previous[current] as T | Record<string, T>;
      }, object) as T)
    : defaultValue;
}

export function doesObjectContainProperty(
  object: Record<string, any>,
  propertyPath: string
): boolean {
  // If there's nothing to check
  if (typeof object !== "object" || !object || !Object.keys(object).length) {
    return false;
  }

  // If there's nothing to check
  if (!propertyPath?.length) {
    return false;
  }

  try {
    // Iterate through propertyPath to dig into the object
    const finalValue = propertyPath.split(".").reduce((previous, current) => {
      // No hasOwnProperty check
      return typeof previous !== "undefined" && previous !== null
        ? previous[current]
        : undefined;
    }, object);
    // We specifically want to check for undefined & null to check if value exist here
    return typeof finalValue !== "undefined" && finalValue !== null;
  } catch {
    // If the path has a wrong turn, the reduce function will throw an error
    return false;
  }
}

export function getWSOptions(debug = false): Options {
  return {
    maxReconnectionDelay: 10000, // max delay in ms between reconnections
    minReconnectionDelay: 1000 + Math.random() * 4000, // min delay in ms between reconnections
    reconnectionDelayGrowFactor: 1.3, // how fast the reconnection delay grows
    minUptime: 5000, // min time in ms to consider connection as stable
    connectionTimeout: 20000, // retry connect if not connected after this time, in ms
    maxRetries: 9, // maximum number of retries
    maxEnqueuedMessages: Infinity, // maximum number of messages to buffer until reconnection
    startClosed: false, // start websocket in CLOSED state, call `.reconnect()` to connect
    debug, // enables debug output
  };
}

export function isEmptyMessage(message: string) {
  return !message || message === "," || message === "\n";
}

export function doesExist(value: any) {
  return (
    typeof value !== "undefined" &&
    value !== null &&
    (typeof value === "string" ? !!value.length : true)
  );
}
