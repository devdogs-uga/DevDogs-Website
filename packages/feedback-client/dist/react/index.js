"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTheme = exports.FeedbackDialog = void 0;
var FeedbackDialog_js_1 = require("./FeedbackDialog.js");
Object.defineProperty(exports, "FeedbackDialog", {
  enumerable: true,
  get: function () {
    return __importDefault(FeedbackDialog_js_1).default;
  },
});
var theme_js_1 = require("./theme.js");
Object.defineProperty(exports, "defaultTheme", {
  enumerable: true,
  get: function () {
    return theme_js_1.defaultTheme;
  },
});
