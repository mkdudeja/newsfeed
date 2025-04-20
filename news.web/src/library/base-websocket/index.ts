import {
  DeferStrategy,
  IWSMessage,
  IWSReadyState,
  WSMessageType,
} from "../../app/shared/interfaces";
import {
  doesExist,
  getPropertyValue,
  getWSOptions,
  isEmptyMessage,
} from "../../app/shared/utils/helper";
import ReconnectingWebSocket, {
  ReadyState,
  type CloseEvent,
  type ErrorEvent,
} from "../reconnecting-websocket";

interface IBaseWSParams {
  deferUpdates: boolean;
  deferStrategy: DeferStrategy;
  reconnectOnIdleState: boolean;
  watchMessageForState: boolean;
  watchForHaltedState: boolean;
}

export default abstract class BaseWebSocket<T = IWSMessage> {
  ws: ReconnectingWebSocket = null;
  source: string = null;

  isPageVisible = true;
  widgetId: string = null;
  connectionId: string = null;
  connectionTimeout: number = null;

  timestamp: number = null; // track the last message timestamp
  reconnectOnIdleState = false;
  watchMessageForState = false;
  watchForHaltedState = false;

  deferUpdates = true;
  loadingState = false;
  readyState: IWSReadyState = null;
  deferStrategy = DeferStrategy.KeepAll;
  defferedMessages: Record<string, T> | T[] = null;

  messageCounter = 0;
  subscriptions: Record<string, string> = {};

  constructor(source: string, params?: Partial<IBaseWSParams>) {
    const options = Object.assign<IBaseWSParams, Partial<IBaseWSParams>>(
      {
        deferUpdates: true,
        deferStrategy: DeferStrategy.KeepAll,
        watchForHaltedState: false,
        watchMessageForState: false,
        reconnectOnIdleState: false,
      },
      params
    );

    this.source = source;
    this.deferUpdates = getPropertyValue<boolean>(
      options,
      "deferUpdates",
      true
    );
    this.deferStrategy = getPropertyValue<DeferStrategy>(
      options,
      "deferStrategy",
      DeferStrategy.KeepAll
    );
    this.defferedMessages =
      this.deferStrategy === DeferStrategy.KeepAll ? [] : {};

    this.watchMessageForState = getPropertyValue<boolean>(
      options,
      "watchMessageForState",
      false
    );

    this.watchForHaltedState = getPropertyValue<boolean>(
      options,
      "watchForHaltedState",
      false
    );

    this.reconnectOnIdleState = getPropertyValue<boolean>(
      options,
      "reconnectOnIdleState",
      false
    );
  }

  public initialize(url: string, params: Record<string, unknown>) {
    const { isDebugMode } = params;

    this.ws = new ReconnectingWebSocket(
      url,
      getWSOptions(isDebugMode as boolean)
    );

    // set websocket binaryType
    this.ws.binaryType = "blob";

    // oninit
    this.ws.oninit = () => {
      this.loadingState = true;
      this.emitWSReadyState();
    };

    // onopen
    this.ws.onopen = (event: Event) => {
      // (re)send the active subscriptions
      Object.values(this.subscriptions).forEach((message) => {
        doesExist(message) && this.sendMessage(message);
      });
      this.onopen(event);
      setTimeout(this.emitWSReadyState.bind(this), 0);
    };

    // onclose
    this.ws.onclose = (event: CloseEvent) => {
      this.onclose(event);
      this.loadingState = false;
      setTimeout(this.emitWSReadyState.bind(this), 0);
    };

    // onerror
    this.ws.onerror = (err: ErrorEvent) => {
      if (err?.message === "TIMEOUT") {
        this.ws.maxRetryLimitReached &&
          console.error(`${this.source}: onerror`, err);
      } else {
        doesExist(err?.message) &&
          console.error(`${this.source}: onerror`, err);
      }
      this.onerror(err);
      this.loadingState = false;
      setTimeout(this.emitWSReadyState.bind(this), 0);
    };

    // onmessage
    this.ws.onmessage = (event: MessageEvent<any>) => {
      this.timestamp = Date.now();
      this.loadingState = false;
      this.emitWSReadyState();
      if (this.watchMessageForState) {
        this._clearConnectionTimeout();
        this.connectionTimeout = setTimeout(() => {
          if (this.isPageVisible && this.reconnectOnIdleState) {
            this.ws.reconnect();
          } else {
            this.emitWSReadyState(ReadyState.Idle);
          }
        }, 2 * 60 * 1000);
      }

      // process the data message
      this._onmessage(event);
    };
  }

  public close() {
    this.ws?.close();
    this._clearConnectionTimeout();
  }

  public emitWSReadyState(state?: number) {
    if (!this.ws) return;

    const readyState = state ?? this.ws.readyState;
    const nextState =
      readyState === ReadyState.Connected && !this.timestamp
        ? ReadyState.Muted
        : readyState;

    // emit ws ready state
    if (this.readyState?.state !== nextState) {
      this.readyState = {
        id: this.connectionId,
        retryCount: this.ws.retryCount + 1,
        maxRetries: this.ws.options.maxRetries + 1,
        state: nextState,
      };

      self?.postMessage({
        type: "WS_READY_STATE",
        payload: this.readyState,
      });
      this.onStateChange(this.readyState);
    }
  }

  public sendMessage(payload: string) {
    if (!this.ws) {
      return;
    }

    if (
      this.ws.readyState === ReconnectingWebSocket.CLOSED ||
      this.ws.readyState === ReconnectingWebSocket.CLOSING
    ) {
      this.ws.reconnect();
    } else {
      // send message
      this.ws.send(payload);
    }
  }

  public onDeferUpdates(payload: boolean): void {
    this.deferUpdates = payload;

    // if there are unprocessed deffered messages, process them....
    if (!payload && doesExist(this.defferedMessages)) {
      if (Array.isArray(this.defferedMessages)) {
        (this.defferedMessages as T[]).forEach((message: T) => {
          this.onWSMessage(message);
        });

        this.defferedMessages.length = 0;
      } else {
        Object.values(this.defferedMessages).forEach((message) => {
          this.onWSMessage(message);
        });
        for (const prop of Object.getOwnPropertyNames(this.defferedMessages)) {
          delete this.defferedMessages[prop];
        }
      }
    }
  }

  public onVisibilityChange(payload: boolean) {
    const diff = this.timestamp ? (Date.now() - this.timestamp) / 1000 : 0; // in seconds
    const forcedReconnect = this.watchForHaltedState && diff >= 40;

    this.isPageVisible = payload;
    this.ws?.onVisibilityChange(payload, forcedReconnect);
    payload && !forcedReconnect && this.emitWSReadyState(); // emit state on visible `true`
  }

  private _onmessage(event: MessageEvent<any>) {
    const msg = event.data;
    if (isEmptyMessage(msg)) {
      return;
    }

    try {
      const message = this._unpackMessage<T>(msg);
      const messageType = (message as IWSMessage)?.type ?? "data";

      if (messageType === WSMessageType.closed) {
        this.close();
      } else if (this.deferUpdates) {
        if (Array.isArray(this.defferedMessages)) {
          (this.defferedMessages as T[]).push(message);
        } else {
          this.defferedMessages[messageType] = message;
        }
      } else {
        this.onWSMessage(message);
      }
    } catch (err) {
      console.error(`${this.source}: onmessage`, err);
    }
  }

  private _unpackMessage<T>(payload: string): T {
    try {
      const parsed = JSON.parse(payload) as T;
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      } else {
        console.log("Received a regular string:", payload);
      }
    } catch {
      console.log("Received a regular string:", payload);
    }
  }

  private _clearConnectionTimeout() {
    this.connectionTimeout && clearTimeout(this.connectionTimeout);
  }

  // An event listener to be called when connection state changes to `OPEN`
  public onopen(_: Event): void {}

  // An event listener to be called when connection state changes to `CLOSED`
  public onclose(_: CloseEvent): void {}

  // An event listener to be called when an error occurs
  public onerror(_: ErrorEvent): void {}

  // An event listener to be called when an ws readyState change occurs
  public onStateChange(_: IWSReadyState): void {}

  // An event listener to be called when ws message ready to be processed
  public abstract onWSMessage(message: T): void;
}
