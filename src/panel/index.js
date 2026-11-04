import PunctuationField from "./components/PunctuationField.vue";
import "./index.css";

window.panel.plugin("johannschopplich/punctuation-section", {
  fields: {
    punctuation: PunctuationField,
  },
});
