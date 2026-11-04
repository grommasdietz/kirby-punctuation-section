<?php

use JohannSchopplich\Punctuation\PunctuationField;
use Kirby\Cms\App;

require_once __DIR__ . '/src/fields/PunctuationField.php';

App::plugin('johannschopplich/punctuation-section', [
    'fields' => ['punctuation' => PunctuationField::class]
]);
