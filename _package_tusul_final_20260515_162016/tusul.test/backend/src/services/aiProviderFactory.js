const { env } = require("../config/env");
const openaiCareerAdvisor = require("./ai/openaiCareerAdvisor");
const simulatedCareerAdvisor = require("./ai/simulatedCareerAdvisor");

function getAiProvider() {
  if (env.openAiApiKey) {
    return openaiCareerAdvisor;
  }

  return simulatedCareerAdvisor;
}

module.exports = {
  getAiProvider
};
