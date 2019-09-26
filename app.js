const Hapi = require("@hapi/hapi");
const Joi = require("joi");
const Mongoose = require("mongoose");
const Todo = require("./Model");

const server = Hapi.server({
  port: 3003,
  host: "localhost"
});

Mongoose.connect("mongodb://localhost/hapi-server");
//route should add item to todo list
server.route({
  method: "PUT",
  path: "/todos",
  options: {
    validate: {
      payload: {
        description: Joi.string().required()
      },
      failAction: (request, h, error) => {
        return error.isJoi
          ? h.response(error.details[0]).takeover()
          : h.response(error).takeover();
      }
    }
  },
  handler: async (request, h) => {
    try {
      let todo = new Todo(request.payload);
      let result = await todo.save();
      return h.response(result);
    } catch (error) {
      return h.response(error).code(500);
    }
  }
});
//route should edit item on todo list
server.route({
  method: "PATCH",
  path: "/todos/{id}",
  options: {
    validate: {
      payload: Joi.object()
        .keys({
          description: Joi.string(),
          state: Joi.string()
        })
        .xor("description", "state"),
      failAction: (request, h, error) => {
        return error.isJoi
          ? h.response(error.details[0]).takeover()
          : h.response(error).takeover();
      }
    }
  },
  handler: async (request, h) => {
    try {
      let result = await Todo.findByIdAndUpdate(
        request.params.id,
        request.payload,
        { new: true }
      );
      return h.response(result);
    } catch (error) {
      return h.response(error).code(500);
    }
  }
});
//route should return todos optionally filtered and ordered
server.route({
  method: "GET",
  path: "/todos/{query?}",
  config: {
    validate: {
      query: {
        filter: Joi.string().valid("completed", "incomplete", "all"),
        orderBy: Joi.string().valid("dateAdded", "description")
      },
      failAction: (request, h, error) => {
        return error.isJoi
          ? h.response(error.details[0]).takeover()
          : h.response(error).takeover();
      }
    }
  },
  handler: async (request, h) => {
    let state = "all";
    let order = "dateAdded";
    if (request.query.filter) state = request.query.filter;
    if (request.query.orderBy) order = request.query.orderBy;
    try {
      let todos;
      if (state === "all") {
        todos = await Todo.find().sort({ order: 1 });
      } else {
        todos = await Todo.find({ state: state }).sort({ order: 1 });
      }

      return h.response(todos);
    } catch (error) {
      return h.response(error).code(500);
    }
  }
});
//route should delete a todo
server.route({
  method: "DELETE",
  path: "/todos/{id}",
  handler: async (request, h) => {
    try {
      await Todo.findByIdAndDelete(request.params.id);
      return h.response({});
    } catch (error) {
      return h.response("404 Page not found").code(404);
    }
  }
});

const init = async () => {
  await server.start();
  console.log("Server running on 3003", server.info.uri);
};

process.on("unhandledRejection", err => {
  console.log(err);
  process.exit(1);
});

init();
