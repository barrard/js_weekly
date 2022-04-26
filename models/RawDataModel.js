const mongoose = require("mongoose");

const RawDataModel = mongoose.Schema({
    type: { type: String, required: true },
    text: { type: String, required: true },
    title: { type: String, required: true },
    href: { type: String },
    articleHREFs: { type: [{}] },

    ISSUE: { type: String, required: true },
});
RawDataModel.index({ ISSUE: 1, title: 1 });

module.exports = mongoose.model("RawDataModel", RawDataModel);
