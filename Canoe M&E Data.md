

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
2. Course Exam Scores



Taking a lesson completion as an example, on lesson complete canoe will...

1. Synchronously appy relevant data to redux state allowing the UI to reflect this data immediately
2. Assign a client code generated date and uuid
3. Asynchronously save the action in Idb, allowing offline retention
4. Asynchronously POST the action to the API, allowing M&E, and re-login retention
5. Retry an unsynched actions preiodically, allowing offline data to be sent to the server



### Lesson Completion

A lesson completion has

- type "completion"
- pageType "lesson"
- title of the lesson
- pageId of the lesson
- answers that may or may not have been given during the lesson content - this is very wasteful, the answers are unimportant, they have to be right to continue, the questions and the number of attempts it took to get right are important
- complete `true` if complete, `false` if set to incomplete (which cannot happen currently through the UI for lessons)

```python
UserAction.objects.filter(user__username='pedro', data__type='completion').last().data
```

```json
{'type': 'completion',
 'title': 'Lesson 4 - Hospital crowding and access block',
 'pageId': '28',
 'synced': 0,
 'answers': {'749b13b4-7633-4274-8866-cd1bb5c084a1': {'tag': 'answer',
   'text': 'Output issues e.g. access block',
   'correct': True,
   'attempts': 3,
   'feedback': {'text': 'The principal cause of crowding in the ED is when patients cannot move out of the ED (i.e. access block)',
    'title': 'Correct!'}},
  'fd9afbbf-e0a7-4965-bfae-4b5ab3532e19': {'tag': 'answer',
   'text': 'When admitted patients block beds in the ED because there are insufficient inpatient beds',
   'correct': True,
   'attempts': 4,
   'feedback': {'text': 'Access block increases crowding in ED and makes it less safe',
    'title': 'Correct!'}}},
 'complete': True,
 'pageType': 'lesson'}
```

looks like I might have forgotten to include the questions here



### Course Completion Data

Course completions have

- type "completion"
- pageType "course"
- title of the course
- pageId of the course
- lesson details of the lesson in that course
- complete `true` if complete, `false` if set to incomplete (which cannot happen currently through the UI for lessons)
- examScoreUuid is the uuid of the related exam score ( if it exists )

I think we may need to add whether the exam is pre-learning or noteither here or below in the scores

```python
UserAction.objects.filter(userusername='andrew', datatype='completion', data__pageType='course')[0].data
```

```json
{'type': 'completion',
 'title': 'Course 1 - Welcome',
 'pageId': '10',
 'synced': 0,
 'lessons': [{'id': '11',
   'title': 'Navigating the Essential Emergency Care Systems training program'}],
 'complete': True,
 'pageType': 'course',
 'examScoreUuid': 'bc1b778a9cf14176885888eecdefbd55'}
```

### Exam Score

Course completions have

- type "exam.finalScore"
- pageId of the course
- score 0-1
- passed true/false ( this is based on a constant in Course.ts )
- answers, the answers given by the user that make up the score

Maybe we should add course title here, and whether the course exam was a pre-learning or not

```python
UserAction.objects.filter(user__username='kara', data__type='exam.finalScore')[0].data
```

```json
{'type': 'exam.finalScore',
 'score': 0.75,
 'pageId': '19',
 'passed': True,
 'synced': 0,
 'answers': [{'answer': {'tag': 'multiAnswer',
    'text': 'Check for high risk vital signs',
    'correct': False,
    'attempts': 0},
   'question': 'What is the first step in every triage assessment?'},
  {'answer': {'tag': 'multiAnswer',
    'text': 'Category 1 because they have red criteria',
    'correct': True,
    'attempts': 0},
   'question': 'After a rapid triage assessment, the triage officer has determined that the patient has 1 red criteria, 3 yellow criteria and no high risk vital signs.  What triage category should be allocated?'},
  {'answer': {'tag': 'multiAnswer',
    'text': 'Observe the patient’s general appearance, ascertain the chief complaint, feel the patient’s pulse and assess capillary refill',
    'correct': True,
    'attempts': 0},
   'question': 'For every triage assessment, the triage officer should:'},
  {'answer': {'tag': 'multiAnswer',
    'text': 'Children under 12 years old',
    'correct': True,
    'attempts': 0},
   'question': 'The paediatric assessment pathway should be used for:'}]}
```

