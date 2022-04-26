const mongoose = require("mongoose");

const IgnoreWord = mongoose.Schema({
    word: { type: String, required: true },
});
IgnoreWord.index({ word: 1 });

module.exports = mongoose.model("IgnoreWord", IgnoreWord);
