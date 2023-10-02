const express = require("express");
const app = express();

app.use(express.json());
const path = require("path");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const dbPath = path.join(__dirname, "todoApplication.db");
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started successfully at port 3000");
    });
  } catch (error) {
    console.log(`Database error ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

// API-1 Get all todos having status TODO
app.get("/todos/", async (request, response) => {
  const { search_query = "", priority, status } = request.query;
  let getTodosQuery = "";
  let data = null;

  switch (true) {
    case hasStatus(request.query):
      getTodosQuery = `
          SELECT
            *
          FROM
            todo
          WHERE 
            todo LIKE '%${search_query}%' AND
            status = '${status}';`;
      break;
    case hasStatusAndPriority(request.query):
      getTodosQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE '%${search_query}%' AND
            status = '${status}' AND
            priority = '${priority}';`;
      break;
    case hasPriority(request.query):
      getTodosQuery = `
          SELECT 
            *
          FROM
            todo
          WHERE
            todo LIKE '%${search_query}' AND
            priority = '${priority}';`;
      break;

    default:
      getTodosQuery = `
          SELECT
            *
          FROM
            todo
           WHERE 
             todo LIKE '%${search_query}%';`;
  }

  dbResponse = await database.all(getTodosQuery);
  response.send(dbResponse);
});

// API-2 Get todo based on ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT 
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;

  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

// API-3 create a todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const createQuery = `
    INSERT INTO
     todo (id, todo, priority, status)
    VALUES
    (
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
    );`;
  await database.run(createQuery);
  response.send("Todo Successfully Added");
});

// API-4 update details
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const prevTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;

  const previousTodo = await database.get(prevTodoQuery);

  const prevTodo = previousTodo.todo;
  const prevPriority = previousTodo.priority;
  const prevStatus = previousTodo.status;

  const {
    todo = prevTodo,
    priority = prevPriority,
    status = prevStatus,
  } = request.body;

  let requestBody = request.body;
  let updatedColumn = "";

  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;

    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;

    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }

  const updateQuery = `
  UPDATE 
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  WHERE
    id = ${todoId};`;

  const updatedTodo = await database.run(updateQuery);
  response.send(`${updatedColumn} Updated`);
});

// API-5 Delete todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;

  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
