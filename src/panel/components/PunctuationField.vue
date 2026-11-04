<script>
export default {
  inheritAttrs: false,
  props: {
    name: String,
    type: String,
    label: String,
    help: [String, Object],
    fieldsets: { type: Array, default: () => [] },
    clipboard: { type: Boolean, default: false },
    theme: { type: String, default: "none" },
  },
  data() {
    return {
      activeChar: null,
      categoryIndex: null,
      lastFocusedElement: null,
      lastSelection: null,
      feedbackTimer: null,
    };
  },
  mounted() {
    if (this.clipboard) return;
    document.addEventListener("focus", this.rememberSelection, true);
    document.addEventListener("blur", this.rememberSelection, true);
    document.addEventListener("selectionchange", this.rememberSelection);
    document.addEventListener("click", this.handleDocumentClick);
  },
  beforeUnmount() {
    clearTimeout(this.feedbackTimer);
    document.removeEventListener("focus", this.rememberSelection, true);
    document.removeEventListener("blur", this.rememberSelection, true);
    document.removeEventListener("selectionchange", this.rememberSelection);
    document.removeEventListener("click", this.handleDocumentClick);
    this.clearSelection();
  },
  methods: {
    characterLabel(char) {
      return Array.from(
        char,
        (character) =>
          `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
      ).join(" ");
    },
    clearSelection() {
      this.lastFocusedElement = null;
      this.lastSelection = null;
    },
    rememberSelection(event) {
      const selection = window.getSelection();
      const target =
        event.type === "selectionchange"
          ? document.activeElement
          : event.target;
      if (!(target instanceof HTMLElement) || this.$el.contains(target)) return;
      if (
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement) &&
        !target.disabled &&
        !target.readOnly &&
        target.selectionStart !== null
      ) {
        this.lastFocusedElement = target;
        this.lastSelection = {
          start: target.selectionStart,
          end: target.selectionEnd,
        };
      } else if (target.isContentEditable && selection?.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (target.contains(range.commonAncestorContainer)) {
          this.lastFocusedElement = target;
          this.lastSelection = range.cloneRange();
        }
      }
    },
    handleDocumentClick(event) {
      const target = event.target;
      if (!(target instanceof Element) || this.$el.contains(target)) return;
      if (!target.closest('input, textarea, [contenteditable="true"]'))
        this.clearSelection();
    },
    async insertCharacter(char, categoryIndex) {
      clearTimeout(this.feedbackTimer);
      this.activeChar = char;
      this.categoryIndex = categoryIndex;
      this.feedbackTimer = setTimeout(() => {
        this.activeChar = null;
        this.categoryIndex = null;
      }, 2000);
      if (this.clipboard) {
        try {
          await navigator.clipboard.writeText(char);
        } catch {
          this.$panel.notification.error(
            "Could not copy the character. Clipboard access requires a secure context and permission.",
          );
        }
        return;
      }
      const element = this.lastFocusedElement;
      if (!element?.isConnected || !this.lastSelection) return;
      if (element.isContentEditable) {
        element.focus();
        const selection = window.getSelection();
        const range = this.lastSelection;
        selection.removeAllRanges();
        selection.addRange(range);
        range.deleteContents();
        const text = document.createTextNode(char);
        range.insertNode(text);
        range.setStartAfter(text);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        this.lastSelection = range.cloneRange();
      } else if (!element.disabled && !element.readOnly) {
        element.setRangeText(
          char,
          this.lastSelection.start,
          this.lastSelection.end,
          "end",
        );
        element.focus();
        this.lastSelection = {
          start: element.selectionStart,
          end: element.selectionEnd,
        };
      } else {
        return;
      }
      // Notify native inputs; Writer's DOM observer records the edit in its model.
      element.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: char,
        }),
      );
    },
  },
};
</script>

<template>
  <k-field
    :name="name"
    :type="type"
    :label="label"
    :help="help"
    :input="false"
    class="k-punctuation-field"
  >
    <k-box :theme="theme">
      <div class="container kps-space-y-1">
        <div v-for="(category, index) in fieldsets" :key="index" class="group">
          <div class="kps-flex kps-items-center kps-gap-2">
            <span>{{ category.label }}:</span>
            <k-button-group class="kps-gap-1">
              <k-button
                v-for="(char, charIndex) in category.chars"
                :key="charIndex"
                :aria-label="characterLabel(char)"
                :title="characterLabel(char)"
                variant="filled"
                size="xs"
                :class="[
                  index === categoryIndex &&
                    char === activeChar &&
                    'kps-outline kps-outline-2 kps-outline-[var(--color-focus)]',
                ]"
                @mousedown.prevent
                @click="insertCharacter(char, index)"
              >
                {{ char }}
              </k-button>
            </k-button-group>
          </div>

          <k-text
            v-if="category.help"
            :html="category.help"
            class="kps-text-[var(--color-text-dimmed)]"
          />
        </div>
      </div>
    </k-box>
  </k-field>
</template>

<style scoped>
.container {
  container-type: inline-size;
  width: 100%;
}

@container (min-width: 640px) {
  .group {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    align-items: start;
  }
}
</style>
