const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const GuildConfigSchema = new Schema({
  id: { type: String, required: true },
  prefix: { type: String, required: false },
  adminRole: { type: String, required: false }
})

const GuildConfig = mongoose.model("GuildConfig", GuildConfigSchema);

module.exports = GuildConfig;