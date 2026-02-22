The task is to implement a Hanguel training web application described in README.md.

Follow these rules when implementing:
- Divide plan to phases in PLAN.md. Phase 1, 2, 3 and so on
- Always number tasks in PLAN.md. Tasks are numbered phase_number.task_number, such as 1.2. Tasks also have a subject.
- In the beginning, all tasks are uncompleted. Mark each task completed as you do them.
- Always follow the order of tasks in PLAN.md

Use these technologies:
- PostgreSQL, with Kysely access, running in Docker container (port 5432). You can assume a Postgres DB is already up and running. Password is "HanguelIsEasy". Username is "kword-user", database name is "kword". The database has not yet been created.
- Node.js and npm. Typescript.
- React with Tailwind in the frontend