const mongoose = require('mongoose');

const todoModel = mongoose.Schema({
  description: String,
  state: {type: String, enum: ['completed', 'incomplete'], default: 'incomplete'},
  dateAdded: {type: Date, default: new Date()}
});
const Todo = module.exports = mongoose.model('todo', todoModel);
module.exports = Todo;
