![Kirby Punctuation Section](./.github/kirby-punctuation-section.png)

# Kirby Punctuation Field — Kirby 6 preview

This plugin provides a simple, **customizable** display field for your Kirby project from which your customers can quickly add punctuation to their text or writer fields.

By default, clicking one of the punctuation buttons will insert the character at the current cursor position of a text or writer field.

## Features

- ♟️ Collect your favourite punctuation characters
- 🪡 Insert characters at the current cursor position
- 🖊️ Optionally paste characters to your clipboard
- 🌐 Fully Translatable

## Requirements

Requires Kirby 6 and PHP 8.3+. This maintained fork keeps Kirby 5 support on `main`; the Kirby 6 preview uses Vue 3 and kirbyup 4 (Node 24, pnpm 12). Johann Schopplich remains the original author; the MIT license is retained.

## Installation

### Composer

```bash
composer config repositories.punctuation vcs https://github.com/grommasdietz/kirby-punctuation-section
composer require johannschopplich/kirby-punctuation-section:dev-kirby-6
```

### Download

Download and copy this repository to `/site/plugins/kirby-punctuation-section`.

## Usage

To get started, create a `fields/punctuation.yml` file in your blueprints folder and add the characters you want to use to the `chars` array. A bare minimum field example looks like this:

```yaml
type: punctuation
label: Punctuations
fieldsets:
  - category:
    label: German Quotation Marks
    chars:
      - „
      - ‚
      - ‘
      - “
    help: This is a description for the category
```

After that, you can add the field to your blueprint like this:

```yml
fields:
  punctuation: fields/punctuation
```

## Clipboard API

Instead of inserting the given character at the current cursor position, you can also copy it to your clipboard by setting the `clipboard` option to `true`:

```yaml
type: punctuation
label: Punctuations
clipboard: true
```

> [!NOTE]
> The Clipboard API is only available for secure contexts, it cannot be used on non-HTTPS pages.
>
> Setting a browser flag can allow HTTP pages to be interpreted as secure, which can be useful for local development.

## Label Translations & Help Texts

Just like other Kirby built-in fields, the `label` and `help` fields can be translated.

You can use either locale arrays (`de`, `en`, …) or translation keys:

```yaml
type: punctuation
label: punctuation.section.label
fieldsets:
  - category:
    label: punctuation.soft-hyphen.label
    help: punctuation.soft-hyphen.help
    chars:
      - ­
```

Take a look at the field blueprint below for a full fledged example:

```yaml
type: punctuation
label:
  de: Kleine Interpunktionshilfe
  en: Lil Punctuation Helper
fieldsets:
  - category:
    label:
      de: Apostroph
      en: Apostrophe
    chars:
      - ’
    help:
      de: Das ist eine Beschreibung der Kategorie
      en: This is a description for the category
  - category:
    label:
      de: Gedankenstrich
      en: Hyphen
    chars:
      - –
  - category:
    label:
      de: Dt. Anführungszeichen
      en: German Quotation Marks
    chars:
      - „
      - ‚
      - ‘
      - “
  - category:
    label:
      de: Engl. Anführungszeichen
      en: English Quotation Marks
    chars:
      - “
      - ‘
      - ’
      - ”
  - category:
    label: Guillemets
    chars:
      - »
      - ›
      - ‹
      - «
  - category:
    label:
      de: Sonstiges
      en: Other
    chars:
      - …
      - ×
```

## License

[MIT](./LICENSE) License © 2021-PRESENT [Johann Schopplich](https://github.com/johannschopplich)

## Migrating from Kirby 5

Kirby 6 removes custom sections. Move every `type: punctuation` entry from `sections` to `fields`, including entries inside columns, and use `label` instead of `headline`. The old `headline` option remains an alias when no label is supplied. `fieldsets`, category labels/help and `clipboard` keep their existing meaning. This display field never stores a content value.

Update custom Panel selectors from `.k-section[type="punctuation"]` to `.k-field-type-punctuation` (or `.k-punctuation-field`). The prefixed `kps-*` classes and whitespace legend markup remain available. Existing Kirby 5 projects keep their current CSS and section plugin.

Category help is trusted blueprint/translation HTML, rendered through Kirby 6's `HtmlString` transport. Character strings and labels render as text. Clipboard mode preserves the exact Unicode sequence. Insert mode replaces the current selection in native text/textarea and Writer fields, and triggers the normal content-save lifecycle.

## Development

```sh
composer install
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm verify
```

The test fixture owns its temporary site, account and content; it does not modify a real project. The Kirby 6 beta's Symfony YAML pin is satisfied with a development-only alias to patched 7.4.23. Remove the alias when the core updates its pin; Composer audit stays enabled. Production installations use the committed Panel assets and do not need Node.

The preview branch has no stable release tag. Publishing the Kirby 6 implementation requires a new plugin major after final core/dependency verification.
