import antfu from "@antfu/eslint-config";

export default antfu(
  {
    stylistic: false,
    isInEditor: false,
    vue: {
      // https://github.com/antfu/eslint-config/issues/367
      sfcBlocks: {
        blocks: {
          styles: false,
        },
      },
      vueVersion: 3,
    },
    ignores: ["**/assets/**", "**/vendor/**", "index.js", "node_modules/**"],
  },
  {
    files: ["**/*.vue"],
    rules: {
      "vue/html-self-closing": "off",
      "vue/html-indent": "off",
    },
  },
);
