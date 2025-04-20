# Take-Home Assessment: News App Frontend

This repository contains a mock backend for a real-time news application that
continously pushes new headlines over WebSocket.

Your task is to create the Web frontend that connects to this backend and
displays the delivered news items in real-time, with the following features:

1. Display news items in a list format, with each item showing:
   - Timestamp, in either local time or UTC
   - Headline
   - Source
   - Link, if provided
   - Associated keywords and assets, if provided
   - Some way of distinguishing high priority items
   - A button labelled "Log to Console" to log the news item object to the
     console

2. Real-time updates:
   - New items should appear immediately when received
   - Items should be sorted by timestamp (newest first)
   - (Optional) Animation to catch the users' attention when new items appear

3. Filtering:
   - Allow filtering by news source
   - Allow filtering by keywords and assets
   - Filters should be applied "instantly"

4. Basic styling:
   - Clean, readable layout
   - (Optional) Responsive design that works on mobile and desktop

5. Error handling:
   - Handle connection loss errors with the WebSocket connection
   - You may silently ignore malformed messages from the WebSocket connection

6. Performance:
   - Efficient handling of large numbers of news items
   - Smooth scrolling and filtering
   - Minimal memory usage
   - Optimized re-rendering
   - Note there is no requirement to keep older items on screen

You are free to implement any additional features as you see fit.
Please keep in mind the user will likely have this app open all the time.

## Getting Started

1. Setup and run the mock backend according to instructions in `README.md`
2. Develop your solution in a separate Git repository

## Project Submission

We expect you to keep track of your progress as you work on the project using
Git, and share the repository with us when you finish the project.

### Evaluation Criteria

Your submission will be evaluated on:

- Code organization and clarity
- Proper handling of WebSocket connections
- Implementation of real-time updates
- Performance considerations
- Error recovery strategies
- UI/UX design choices, including aesthetics
- Overall usability, reliability and stability

### README

Write your README as if it was for a production service and the only document
available for other developers. Include the following items:

- Description of the problem and solution.
- How to test/build/deploy/use your solution.
- Reasoning behind your technical choices, including architectural decisions.
- Trade-offs you might have made, anything you left out, or what you might do
  differently if you were to spend additional time on the project.

The easier it is to understand your code the better grade it would have.

### AI Usage

You may use AI to assist you with the project. Please document which model(s)
and the prompts you have used.

### Pay specific attention to the following:

1. Correctness / Robustness – e.g. does it behave correctly if a client's
   connection is unstable for a few seconds? Can we easily build and deploy?
2. Performance / Scalability – both in client side and server side.
3. Code Style / Terseness / Proper use of latest technologies.
4. UI aesthetics.
5. Communication skills and documentation.
6. **Please spend no more than a few hours** – if you run out of time, document
   what features are missing, and how you would approach them if you have more
   time.

---
Copyright © 2025 hermeneutic Investments. All rights reserved.
