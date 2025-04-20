import { ReadyState } from "../../../library/reconnecting-websocket";

export enum DeferStrategy {
  KeepAll = "keepall",
  KeepLast = "keeplast",
}

export enum WSMessageType {
  closed = "closed",
  data = "data",
  message = "message",
}

export type TWSMessageType =
  | WSMessageType.closed
  | WSMessageType.data
  | WSMessageType.message;

export interface IWSMessage<T = any> {
  type: TWSMessageType;
  payload: T;
}

export interface IWSReadyState {
  id: string;
  state: ReadyState;
  retryCount: number;
  maxRetries: number;
}
