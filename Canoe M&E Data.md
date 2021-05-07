

# Canoe M&E Data

An overview of the data submitted by the canoe client application

## Google Analytics

Canoe submits page navigations to Google Analytics for uasge, device, location imformation this is intended to be non-identifying data

## User Actions

Canoe submits the following identifiable user tracking data actions:

1. Page Completions
   1. user completes a lesson
   2. user completes a course
   3. user completes a teaching activity
   4. user completes a teaching activity topic
2. Course Exam Scores - both failures and passes

Taking a lesson completion as an example, on lesson complete canoe will...

1. Synchronously apply relevant data to redux state allowing the UI to reflect this data immediately
2. Assign a client code generated date and uuid
3. Asynchronously save the action in Idb, allowing offline retention
4. Asynchronously POST the action to the API, allowing M&E, and re-login retention
5. Retry any unsynched actions preiodically, allowing offline data to be sent to the server

### Page Completion Detail

A completion has

- type "completion"
- pageId of the wagtail Page
- revisionId of the wagtail PegeRevision
- version of the Page ( last content modified timestamp )
- cardData object keyed by streamchild uuid that contains info about user interaction in those cards
  - in lessons with test cards these contain an array of attempts at an answer, the last one should always be correct currently
- complete `true` if complete, `false` if set to incomplete

### Exam Score

An exam score has

- type "exam.finalScore"
- pageId of the wagtail Page
- revisionId of the wagtail PegeRevision
- version of the Page ( last content modified timestamp )
- cardData object keyed by streamchild uuid that contains info about user interaction in those cards
  - these are the submitted answers ( arrays of indices ) relating to answers in exam questions
- score 0-1
- passed true/false
- pass score ( this is based on a constant in Course.ts )