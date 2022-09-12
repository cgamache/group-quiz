# Group Quiz App

## Description

Hosted Nodejs app, provides real time "quiz" experience from mobile phones.

Requires some Redis back-end.

## Improvements

Right now, it will serve one quiz to a stack of anonymous participants. There is no data persistence nor is 
there any security for host or scoreboard views.

It could be improved by:

 1. Providing app state via redis
 2. Providing authorization and authentication for hosts/scoreboard
 3. Allowing for multiple quizzes to be stored and served
 4. Providing an interactive quiz creator/editor
 5. Persisting quiz session answers and participants
 6. Event protocol cleanup
 7. Styling (always styling)



