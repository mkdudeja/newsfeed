# Real-time news application

App displays the real-time news feed. News feed can be filtered basis the news source, assets and keywords.

## How to run it

To run the app, `cd` into the `news.web` project, and run the following commands to run the app either in `dev` or `prod` mode.

### Install npm packages

> npm install

### Run the `dev` server

> npm start

### Build the app

> npm run build

### Run the `prod` build

> npx serve -s ./dist/

### `debug` mode

> http://localhost:3000?debug=true

`debug` mode will log the `ws` connection attemps, sent and received message on the console log.

## Technical Choices

### Data Layer

- For websockets connection handling, I'have used a library (self written in the past, built on top of reconnecting-websockets on npm) to handle the `ws` connection failures and make re-attempts at incremental intervals.
- Websocket connection handling is done on the worker thread separately from the `main` thread to offload the connection and to keep the `main` thread free for UI interatcions.
- Since, news items comes continuously in sequence after a delay, have used the debounced mechanism to keep the news items in buffer and only process them further once there is no further news recieved in the window of `300ms`. This helps process and send the news items in batch to the main thread.

### UI Layer

- UI code organization:
  - controller: To abstract the news feed functionality
  - componenets: To render the UI elements
- Virtualization (react-window) has been used on the UI to render the news. This helps to keep the DOM minimal and render only visible news items.
- To allow filtering the news, options list of sources, assets and keywords is created from coming new items and multi-select dropdown control created to let user set the filter criteria.
- Tailwind is used for the page layout and overall look and feel of the current implementation.

## AI Usage

- AI (chatgpt) prompts used to create the UI layer components like multi-select dropdowns & news card to save on the time.

## Furture Enhancements

- Enable virtualization on the dropdown lists to solve for the usecase when souces, assets and keywords also grows large enough.
- Animation to visually distinguish the news items being added to the top.
