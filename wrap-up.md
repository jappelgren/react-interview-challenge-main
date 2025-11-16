## Questions

### What issues, if any, did you find with the existing code?
Frontend failed to handle anything other than a successful transaction.
Frontend allowed any value to be sent in a transaction (0, -12, 0.3232, 'hello').
Frontend contained nothing to alert user of failure/success.
Error handling on backend was not robust.
Debatably an issue because there isn't anything too complicated but, there are no comments in the entire project.
No preexisting tests.

### What issues, if any, did you find with the request to add functionality?
I didn't notice any specific issues with the request.  There was some additional work done to make the application behave better that was outside of the scope of the request. As called out above, the ability to send anything to the backend int he deposit and withdrawal fields. Nothing being called out in the request on how to handle fractional dollar amounts. The need to keep track of transactions but no table in the database that does this.

### Would you modify the structure of this project if you were to start it over? If so, how?
I think the structure of the project is fine as is.  As the project grows it's front end components should probably be broken down further into smaller components.  Maybe some type of shared schema model between the frontend and backend could be added.

### Were there any pieces of this project that you were not able to complete that you'd like to mention?
I believe I completed everything that was asked for in the README and a little more.

### If you were to continue building this out, what would you like to add next?
I only added tests for the logic I added for deposits and withdrawals.  Adding tests to the preexisting code would be a priority.  Obviously that login page could use a password.  Probably some type of confirmation modal when making a deposit or withdrawal. Adding the .env to the .gitignore, that was a hard thing for me to commit.

### If you have any other comments or info you'd like the reviewers to know, please add them below.
This was a fun exercise.  Looking forward to hearing some feedback, hope to speak with you all soon.