<?php

declare(strict_types = 1);

namespace JohannSchopplich\Punctuation;

use Kirby\Form\Field\DisplayField;
use Kirby\Reflection\Attributes\Prop;
use Kirby\Toolkit\HtmlString;
use Kirby\Toolkit\I18n;

final class PunctuationField extends DisplayField
{
    #[Prop(computed: true)]
    protected array $fieldsets = [];

    #[Prop]
    protected bool $clipboard = false;

    #[Prop]
    protected string $theme = 'none';

    // Compatibility for project blueprints that used the old section headline.
    #[Prop(export: false)]
    protected array|string|null $headline = null;

    #[\Override]
    public function label(): string
    {
        if ($this->label === null && $this->headline !== null) {
            return I18n::translate($this->headline, $this->headline);
        }
        return parent::label();
    }

    public function fieldsets(): array
    {
        $categories = [];
        foreach ($this->fieldsets as $category) {
            if (!is_array($category)) {
                continue;
            }
            $chars = array_values(array_filter(
                is_array($category['chars'] ?? null) ? $category['chars'] : [],
                static fn (mixed $char): bool => is_string($char) && $char !== ''
            ));
            if ($chars === []) {
                continue;
            }
            $label = $category['label'] ?? '';
            $help = $category['help'] ?? null;
            $categories[] = [
                'label' => is_string($label) || is_array($label) ? I18n::translate($label, $label) : '',
                'help' => is_string($help) || is_array($help) ? HtmlString::translate($help) : null,
                'chars' => $chars,
            ];
        }
        return $categories;
    }
}
