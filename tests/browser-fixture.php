<?php

declare(strict_types = 1);

use Kirby\Cms\App;

$pluginRoot = dirname(__DIR__);
$external = getenv('KIRBY_TEST_AUTOLOAD');
require is_string($external) && $external !== '' ? $external : $pluginRoot . '/vendor/autoload.php';
$root = getenv('KIRBY_BROWSER_ROOT') ?: throw new RuntimeException('Missing owned browser fixture root.');
$core = dirname((new ReflectionClass(App::class))->getFileName(), 3);
$bootstrap = getenv('KIRBY_BROWSER_BOOTSTRAP');
if (is_string($bootstrap) && is_file($bootstrap)) {
    require_once $bootstrap;
}
$app = new App([
    'roots' => ['index' => $root, 'kirby' => $core],
    'urls' => ['index' => getenv('KIRBY_BROWSER_URL'), 'kirby' => '/kirby'],
    'options' => ['debug' => true, 'whoops' => false, 'cache' => ['pages' => ['active' => false]], 'auth' => ['methods' => ['password']]],
]);
if (PHP_SAPI === 'cli') {
    $app->impersonate('kirby');
    $app->users()->create(['email' => 'fixture@example.test', 'password' => 'browser-fixture', 'role' => 'admin', 'language' => 'en']);
    fwrite(STDOUT, $core);
} else {
    echo $app->render();
}
