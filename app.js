const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
                                                              AND status = '${status}'
                                                              AND priority = '${priority}';`;
        }
      }

      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
                                                           AND priority = '${priority}';`;
      }

      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
                                                               AND status = '${status}';`;
      }

      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const todoIdQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const getTodoQueryResult = await db.get(todoIdQuery);
  response.send(getTodoQueryResult);
});

app.post(`/todos/`, async (request, response) => {
  const { id, todo, priority, status } = request.body;

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const postQuery = `INSERT INTO todo (id,todo,priority,status)
              Values(${id},'${todo}','${priority}','${status}');`;
      await db.run(postQuery);
      response.send("Todo Successfully Added");
    }
  }
});

app.put(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const { priority, todo, status } = request.body;

  let upDateQuery = "";
  let upDateParameter = "";
  const bodyReq = request.body;

  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      upDateQuery = `UPDATE todo SET status='${bodyReq.status}' WHERE id=${todoId};`;
      upDateParameter = "Status";
    }
  } else if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      upDateQuery = `UPDATE todo SET priority='${bodyReq.priority}' WHERE id=${todoId};`;
      upDateParameter = "Priority";
    }
  } else if (todo !== undefined) {
    upDateQuery = `UPDATE todo SET todo='${bodyReq.todo}' WHERE id=${todoId};`;
    upDateParameter = "Todo";
  }

  await db.run(upDateQuery);
  response.send(`${upDateParameter} Updated`);
});

app.delete(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
