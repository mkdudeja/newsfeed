import * as Events from "./events";
import {
  ReadyState,
  type ListenersMap,
  type Message,
  type Options,
  type UrlProvider,
} from "./types";

const getGlobalWebSocket = (): WebSocket | undefined => {
  if (typeof WebSocket !== "undefined") {
    // @ts-expect-error reconnecting-websocket
    return WebSocket;
  }
};

/**
 * Returns true if given argument looks like a WebSocket class
 */
const isWebSocket = (w: WebSocket) =>
  typeof w !== "undefined" && !!w && w.CLOSING === 2;

const DEFAULT = {
  maxReconnectionDelay: 10000,
  minReconnectionDelay: 1000 + Math.random() * 4000,
  minUptime: 5000,
  reconnectionDelayGrowFactor: 1.3,
  connectionTimeout: 4000,
  maxRetries: Infinity,
  maxEnqueuedMessages: Infinity,
  startClosed: false,
  debug: false,
};

export default class ReconnectingWebSocket {
  private _ws?: WebSocket;
  private _listeners: ListenersMap = {
    init: [],
    error: [],
    message: [],
    open: [],
    close: [],
  };
  private _retryCount = -1;
  private _uptimeTimeout: number;
  private _connectTimeout: number;
  private _shouldReconnect = true;
  private _connectLock = false;
  private _isPageVisible = true;
  private _binaryType: BinaryType = "blob";
  private _closeCalled = false;
  private _messageQueue: Message[] = [];

  private readonly _url: UrlProvider;
  private readonly _options: Options;
  private readonly _protocols?: string | string[];

  constructor(
    url: UrlProvider,
    options: Options = {},
    protocols?: string | string[]
  ) {
    this._url = url;
    this._protocols = protocols;
    this._options = options;
    if (this._options.startClosed) {
      this._shouldReconnect = false;
    }
    this._connect();
  }

  static get CONNECTING() {
    return ReadyState.Connecting;
  }
  static get OPEN() {
    return ReadyState.Connected;
  }
  static get CLOSING() {
    return ReadyState.Closing;
  }
  static get CLOSED() {
    return ReadyState.Closed;
  }

  get CONNECTING() {
    return ReconnectingWebSocket.CONNECTING;
  }
  get OPEN() {
    return ReconnectingWebSocket.OPEN;
  }
  get CLOSING() {
    return ReconnectingWebSocket.CLOSING;
  }
  get CLOSED() {
    return ReconnectingWebSocket.CLOSED;
  }

  get binaryType() {
    return this._ws ? this._ws.binaryType : this._binaryType;
  }

  set binaryType(value: BinaryType) {
    this._binaryType = value;
    if (this._ws) {
      this._ws.binaryType = value;
    }
  }

  /**
   * Returns the number or connection retries
   */
  get retryCount(): number {
    return Math.max(this._retryCount, 0);
  }

  /**
   * The number of bytes of data that have been queued using calls to send() but not yet
   * transmitted to the network. This value resets to zero once all queued data has been sent.
   * This value does not reset to zero when the connection is closed; if you keep calling send(),
   * this will continue to climb. Read only
   */
  get bufferedAmount(): number {
    const bytes = this._messageQueue.reduce<number>((acc, message) => {
      if (typeof message === "string") {
        acc += Number(message.length); // not byte size
      } else if (message instanceof Blob) {
        acc += Number(message.size);
      } else {
        acc += Number(message.byteLength);
      }
      return acc;
    }, 0);
    return bytes + (this._ws ? this._ws.bufferedAmount : 0);
  }

  /**
   * The extensions selected by the server. This is currently only the empty string or a list of
   * extensions as negotiated by the connection
   */
  get extensions(): string {
    return this._ws ? this._ws.extensions : "";
  }

  get options(): Options {
    return this._options;
  }

  /**
   * A string indicating the name of the sub-protocol the server selected;
   * this will be one of the strings specified in the protocols parameter when creating the
   * WebSocket object
   */
  get protocol(): string {
    return this._ws ? this._ws.protocol : "";
  }

  /**
   * The current state of the connection; this is one of the Ready state constants
   */
  get readyState(): number {
    if (this._ws) {
      return this._ws.readyState;
    }
    return this._options.startClosed
      ? ReconnectingWebSocket.CLOSED
      : ReconnectingWebSocket.CONNECTING;
  }

  /**
   * The URL as resolved by the constructor
   */
  get url(): string {
    return this._ws ? this._ws.url : "";
  }

  /**
   * An event listener to be called when connection is initiated by the client
   */
  public oninit: (() => void) | null = null;

  /**
   * An event listener to be called when the WebSocket connection's readyState changes to CLOSED
   */
  public onclose: ((event: Events.CloseEvent) => void) | null = null;

  /**
   * An event listener to be called when an error occurs
   */
  public onerror: ((event: Events.ErrorEvent) => void) | null = null;

  /**
   * An event listener to be called when a message is received from the server
   */
  public onmessage: ((event: MessageEvent) => void) | null = null;

  /**
   * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
   * this indicates that the connection is ready to send and receive data
   */
  public onopen: ((event: Event) => void) | null = null;

  /**
   * Closes the WebSocket connection or connection attempt, if any. If the connection is already
   * CLOSED, this method does nothing
   */
  public close(code = 1000, reason?: string) {
    this._closeCalled = true;
    this._shouldReconnect = false;
    this._clearTimeouts();
    if (!this._ws) {
      this._debug("close enqueued: no ws instance");
      return;
    }
    if (this._ws.readyState === this.CLOSED) {
      this._debug("close: already closed");
      return;
    }
    this._disconnect(code, reason);
  }

  /**
   * Get the remaining retries
   */
  get maxRetryLimitReached() {
    return this._retryCount >= DEFAULT.maxRetries;
  }

  /**
   * Toggles the reconnect basis visibility
   * Visibility off - _shouldReconnect set to false .
   * Visibility on - reconnect if connection is not opened.
   */
  public onVisibilityChange(visibility: boolean, forcedReconnect = false) {
    this._isPageVisible = visibility;
    if (this._isPageVisible) {
      const reconnect =
        !this._closeCalled &&
        (forcedReconnect ||
          this._ws?.readyState === this.CLOSED ||
          this._ws?.readyState === this.CLOSING);
      reconnect && this.reconnect();
    } else {
      this._shouldReconnect = false;
    }
  }

  /**
   * Closes the WebSocket connection or connection attempt and connects again.
   * Resets retry counter;
   */
  public reconnect(code?: number, reason?: string) {
    this._shouldReconnect = true;
    this._closeCalled = false;
    this._retryCount = -1;
    if (!this._ws || this._ws.readyState === this.CLOSED) {
      this._connect();
    } else {
      this._disconnect(code, reason);
      this._connect();
    }
  }

  /**
   * Enqueue specified data to be transmitted to the server over the WebSocket connection
   */
  public send(data: Message) {
    if (this._ws && this._ws.readyState === this.OPEN) {
      this._debug("send", data);
      this._ws.send(data);
    } else {
      const { maxEnqueuedMessages = DEFAULT.maxEnqueuedMessages } =
        this._options;
      if (this._messageQueue.length < maxEnqueuedMessages) {
        this._debug("enqueue", data);
        this._messageQueue.push(data);
      }
    }
  }

  /**
   * Register an event handler of a specific event type
   */
  public addEventListener<T extends keyof Events.WebSocketEventListenerMap>(
    type: T,
    listener: Events.WebSocketEventListenerMap[T]
  ): void {
    if (this._listeners[type]) {
      // @ts-expect-error reconnecting-websocket
      this._listeners[type].push(listener);
    }
  }

  public dispatchEvent(event: Event) {
    const listeners =
      this._listeners[event.type as keyof Events.WebSocketEventListenerMap];
    if (listeners) {
      for (const listener of listeners) {
        this._callEventListener(event, listener);
      }
    }
    return true;
  }

  /**
   * Removes an event listener
   */
  public removeEventListener<T extends keyof Events.WebSocketEventListenerMap>(
    type: T,
    listener: Events.WebSocketEventListenerMap[T]
  ): void {
    if (this._listeners[type]) {
      // @ts-expect-error reconnecting-websocket
      this._listeners[type] = this._listeners[type].filter(
        (l) => l !== listener
      );
    }
  }

  private _debug(...args: unknown[]) {
    if (this._options.debug) {
      // eslint-disable-next-line no-useless-call
      console.log.apply(console, ["RWS>", ...args, new Date()]);
    }
  }

  private _getNextDelay() {
    const {
      reconnectionDelayGrowFactor = DEFAULT.reconnectionDelayGrowFactor,
      minReconnectionDelay = DEFAULT.minReconnectionDelay,
      maxReconnectionDelay = DEFAULT.maxReconnectionDelay,
    } = this._options;
    let delay = 0;
    if (this._retryCount > 0) {
      delay =
        minReconnectionDelay *
        Math.pow(reconnectionDelayGrowFactor, this._retryCount - 1);
      if (delay > maxReconnectionDelay) {
        delay = maxReconnectionDelay;
      }
    }
    this._debug("next delay", delay);
    return delay;
  }

  private async _wait(): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, this._getNextDelay());
    });
  }

  private async _getNextUrl(urlProvider: UrlProvider): Promise<string> {
    if (typeof urlProvider === "string") {
      return await Promise.resolve(urlProvider);
    }
    if (typeof urlProvider === "function") {
      const url = urlProvider();
      if (typeof url === "string") {
        return await Promise.resolve(url);
      }
      if (url.then) {
        const result = await url;
        return result;
      }
    }
    throw Error("Invalid URL");
  }

  private _connect() {
    if (this._connectLock || !this._shouldReconnect) {
      return;
    }
    this._connectLock = true;

    const {
      maxRetries = DEFAULT.maxRetries,
      connectionTimeout = DEFAULT.connectionTimeout,
      WebSocket = getGlobalWebSocket(),
    } = this._options;

    if (this._retryCount >= maxRetries) {
      this._debug("max retries reached", this._retryCount, ">=", maxRetries);
      return;
    }

    this._retryCount++;

    this._debug("connect", this._retryCount);
    this._removeListeners();
    if (!isWebSocket(WebSocket)) {
      throw Error("No valid WebSocket class provided");
    }
    this._wait()
      .then(async () => await this._getNextUrl(this._url))
      .then((url) => {
        // close could be called before creating the ws
        if (this._closeCalled) {
          return;
        }
        this._debug("connect", { url, protocols: this._protocols });
        this._ws = this._protocols
          ? new WebSocket(url, this._protocols)
          : new WebSocket(url);
        this._ws.binaryType = this._binaryType;
        this._connectLock = false;
        this._addListeners();

        this._handleInit();
        this._connectTimeout = setTimeout(() => {
          this._handleTimeout();
        }, connectionTimeout);
      });
  }

  private _handleTimeout() {
    this._debug("timeout event");
    this._handleError(new Events.ErrorEvent(Error("TIMEOUT"), this));
  }

  private _disconnect(code = 1000, reason?: string) {
    this._clearTimeouts();
    if (!this._ws) {
      return;
    }

    try {
      this._ws.close(code, reason);
    } catch (error) {
      // ignore
      this._debug("_disconnect", error);
    }
  }

  private _acceptOpen() {
    this._debug("accept open");
    this._retryCount = 0;
  }

  private _callEventListener<T extends keyof Events.WebSocketEventListenerMap>(
    event: Events.WebSocketEventMap[T],
    listener: Events.WebSocketEventListenerMap[T]
  ) {
    if ("handleEvent" in listener) {
      // @ts-expect-error reconnecting-websocket
      listener.handleEvent(event);
    } else {
      // @ts-expect-error reconnecting-websocket
      listener(event);
    }
  }

  private readonly _handleOpen = (event: Event) => {
    this._debug("open event");
    const { minUptime = DEFAULT.minUptime } = this._options;

    clearTimeout(this._connectTimeout);
    this._uptimeTimeout = setTimeout(() => {
      this._acceptOpen();
    }, minUptime);

    this._ws.binaryType = this._binaryType;

    // send enqueued messages (messages sent before websocket open event)
    this._messageQueue.forEach((message) => {
      this._ws?.send(message);
    });
    this._messageQueue = [];

    if (this.onopen) {
      this.onopen(event);
    }
    this._listeners.open.forEach((listener) => {
      this._callEventListener(event, listener);
    });
  };

  private readonly _handleMessage = (event: MessageEvent) => {
    this._debug("message event");

    if (this.onmessage) {
      this.onmessage(event);
    }
    this._listeners.message.forEach((listener) => {
      this._callEventListener(event, listener);
    });
  };

  private readonly _handleInit = () => {
    this._debug("init event");

    if (this.oninit) {
      this.oninit();
    }

    this._listeners.init.forEach((listener) => {
      this._callEventListener(undefined, listener);
    });
  };

  private readonly _handleError = (event: Events.ErrorEvent) => {
    this._debug("error event", event.message);
    this._disconnect(
      undefined,
      event.message === "TIMEOUT" ? "timeout" : undefined
    );

    if (this.onerror) {
      this.onerror(event);
    }
    this._debug("exec error listeners");
    this._listeners.error.forEach((listener) => {
      this._callEventListener(event, listener);
    });

    this._connect();
  };

  private readonly _handleClose = (event: CloseEvent) => {
    this._debug("close event");
    this._clearTimeouts();

    if (this._shouldReconnect) {
      this._connect();
    } else {
      this._removeListeners();
    }

    if (this.onclose) {
      this.onclose(event);
    }
    this._listeners.close.forEach((listener) => {
      this._callEventListener(event, listener);
    });
  };

  private _removeListeners() {
    if (!this._ws) {
      return;
    }
    this._debug("removeListeners");
    this._ws.removeEventListener("init", this._handleInit);
    this._ws.removeEventListener("open", this._handleOpen);
    this._ws.removeEventListener("close", this._handleClose);
    this._ws.removeEventListener("message", this._handleMessage);
    // @ts-expect-error reconnecting-websocket
    this._ws.removeEventListener("error", this._handleError);
  }

  private _addListeners() {
    if (!this._ws) {
      return;
    }
    this._debug("addListeners");
    this._ws.addEventListener("init", this._handleInit);
    this._ws.addEventListener("open", this._handleOpen);
    this._ws.addEventListener("close", this._handleClose);
    this._ws.addEventListener("message", this._handleMessage);
    // @ts-expect-error reconnecting-websocket
    this._ws.addEventListener("error", this._handleError);
  }

  private _clearTimeouts() {
    clearTimeout(this._connectTimeout);
    clearTimeout(this._uptimeTimeout);
  }
}
