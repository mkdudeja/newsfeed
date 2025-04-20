import * as Events from "./events";

export type Event = Events.Event;
export type ErrorEvent = Events.ErrorEvent;
export type CloseEvent = Events.CloseEvent;

export interface Options {
  WebSocket?: any;
  maxReconnectionDelay?: number;
  minReconnectionDelay?: number;
  reconnectionDelayGrowFactor?: number;
  minUptime?: number;
  connectionTimeout?: number;
  maxRetries?: number;
  maxEnqueuedMessages?: number;
  startClosed?: boolean;
  debug?: boolean;
}

export type UrlProvider = string | (() => string) | (() => Promise<string>);

export type Message = string | ArrayBuffer | Blob | ArrayBufferView;

export interface ListenersMap {
  init: Array<() => void>;
  error: Array<Events.WebSocketEventListenerMap["error"]>;
  message: Array<Events.WebSocketEventListenerMap["message"]>;
  open: Array<Events.WebSocketEventListenerMap["open"]>;
  close: Array<Events.WebSocketEventListenerMap["close"]>;
}

export enum ReadyState {
  Connecting = 0,
  Connected = 1,
  Closing = 2,
  Closed = 3,
  Muted = 4,
  Idle = 5,
}
