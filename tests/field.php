<?php

declare(strict_types = 1);

use JohannSchopplich\Punctuation\PunctuationField;
use Kirby\Cms\App;
use Kirby\Filesystem\Dir;
use Kirby\Form\Form;
use Kirby\Toolkit\HtmlString;

require dirname(__DIR__) . '/vendor/autoload.php';
$root = sys_get_temp_dir() . '/punctuation-field-' . bin2hex(random_bytes(8));
Dir::make($root . '/content');
$check = static function (bool $value, string $message): void {
    if (!$value) {
        throw new RuntimeException($message);
    }
};
try {
    $app = new App(['roots' => ['index' => $root], 'options' => ['whoops' => false, 'debug' => false]]);
    require dirname(__DIR__) . '/index.php';
    $app = new App(['roots' => ['index' => $root], 'options' => ['whoops' => false, 'debug' => false]]);
    $app->setCurrentTranslation('de');
    $categories = [
        ['label' => ['de' => 'Leerzeichen', 'en' => 'Spaces'], 'help' => '<span class="hidden-characters">ABC 123</span>', 'chars' => ["\u{00a0}", "\u{202f}", "\u{200b}", '', false]],
        ['label' => '<img src=x onerror=alert(1)>', 'chars' => ['<']],
        ['label' => 'Empty', 'chars' => []],
        false,
    ];
    $field = new PunctuationField(model: $app->site(), name: 'legend', headline: ['de' => 'Typografie', 'en' => 'Typography'], fieldsets: $categories, clipboard: true);
    $props = $field->props();
    $check($props['label'] === 'Typografie', 'Translate the legacy headline alias.');
    $check($props['clipboard'] === true, 'Keep clipboard mode.');
    $check($field->hasValue() === false && $props['saveable'] === false, 'Display field stores no content value.');
    $check($props['fieldsets'][0]['chars'] === ["\u{00a0}", "\u{202f}", "\u{200b}"], 'Preserve exact invisible Unicode; omit invalid and empty characters.');
    $check(count($props['fieldsets']) === 2, 'Ignore malformed and empty categories.');
    $check($props['fieldsets'][0]['label'] === 'Leerzeichen', 'Translate category labels on the server.');
    $check($props['fieldsets'][0]['help'] instanceof HtmlString, 'Transport trusted blueprint HTML explicitly.');
    $resolved = HtmlString::resolve($props);
    $check(isset($resolved['fieldsets'][0]['<help>']), 'Serialize trusted nested category help.');
    $check(!isset($resolved['fieldsets'][1]['<label>']), 'Keep labels plain text.');
    $explicit = new PunctuationField(name: 'legend', label: 'Explicit', headline: 'Legacy');
    $check($explicit->label() === 'Explicit', 'Prefer a native label over the legacy alias.');
    $form = new Form(fields: ['legend' => ['type' => 'punctuation', 'fieldsets' => $categories], 'text' => ['type' => 'text']], model: $app->site());
    $form->submit(['legend' => 'must not be saved', 'text' => 'Saved text']);
    $check($form->toStoredValues() === ['text' => 'Saved text'], 'Omit the display field from submitted storage values.');
    fwrite(STDOUT, "Punctuation native field, Unicode, translations, trusted HTML and storage checks passed.\n");
} finally {
    App::destroy();
    Dir::remove($root);
}
