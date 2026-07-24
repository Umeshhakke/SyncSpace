const mongoose = require("mongoose");

const YjsDocumentSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },

  yjsState: {
    type: Buffer,
    required: true,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("YjsDocument", YjsDocumentSchema);