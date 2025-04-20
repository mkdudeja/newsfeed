import BaseWebSocket from "../../library/base-websocket";
import { DeferStrategy, IWSMessage } from "../shared/interfaces";

declare const self: Worker;
export default {} as typeof Worker & (new () => Worker);

self.onmessage = function (event: MessageEvent) {
  const message = event.data;
  switch (message.type) {
    case "WS_INIT":
      newsWebSocket.initialize("ws://localhost:8080", message.payload);
      break;

    case "WS_SEND_MESSAGE":
      newsWebSocket.sendMessage(message.payload);
      break;

    case "WS_CLOSE":
      break;
  }
};

class NewWebSocket extends BaseWebSocket {
  private bufferedMessages: IWSMessage<any>[] = [];
  private debounceTimer: number | null = null;

  public onWSMessage(message: IWSMessage<any>): void {
    if (!message) return;

    // buffer messages to process the messages at once...
    this.bufferedMessages.push(message);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushMessages();
    }, 300); // debounce delay
  }

  private flushMessages() {
    if (this.bufferedMessages.length === 0) return;

    const batch = [...this.bufferedMessages.reverse()];
    this.bufferedMessages = [];

    self.postMessage({
      type: "WS_DATA",
      payload: batch,
    });
  }
}

const newsWebSocket = new NewWebSocket("NewWebSocket", {
  deferUpdates: false,
  deferStrategy: DeferStrategy.KeepAll,
  watchForHaltedState: true,
  watchMessageForState: true,
  reconnectOnIdleState: true,
});
