'use strict'
const Hapi = require("@hapi/hapi");
const Joi = require("joi");
const Mongoose = require("mongoose");
const Todo = require("./Model");

const server = Hapi.server({
  port: 3003,
  host: "localhost"
});

Mongoose.connect("mongodb://localhost/hapi-server");

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

server.route({
  method: "GET",
  path: "/todos",
  handler: async (request, h) => {
    try {
      let todos = await Todo.find().exec();
      return h.response(todos);
    } catch (error) {
      return h.response(error).code(500);
    }
  }
});

server.route({
  method: "DELETE",
  path: "/todos/{id}",
  handler: async (request, h) => {
    try {
      await Todo.findByIdAndDelete(request.params.id);
      return h.response({});
    } catch (error) {
      return h.response('404 Page not found').code(404);
    }
  }
});


server.route({
  method: 'DELETE',
  path: '/{path*}',
  handler: function (request, h) {

      return '404 Error! Page Not Found!';
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
