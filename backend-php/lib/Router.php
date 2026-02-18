<?php

class Router {
    private array $routes = [];

    public function get(string $path, callable $handler): void {
        $this->routes[] = ['GET', $path, $handler];
    }

    public function post(string $path, callable $handler): void {
        $this->routes[] = ['POST', $path, $handler];
    }

    public function patch(string $path, callable $handler): void {
        $this->routes[] = ['PATCH', $path, $handler];
    }

    public function delete(string $path, callable $handler): void {
        $this->routes[] = ['DELETE', $path, $handler];
    }

    public function dispatch(string $method, string $uri): bool {
        $uri = parse_url($uri, PHP_URL_PATH);
        $uri = rtrim($uri, '/') ?: '/';

        foreach ($this->routes as [$routeMethod, $routePath, $handler]) {
            if ($routeMethod !== $method) continue;

            $pattern = $this->pathToRegex($routePath);
            if (preg_match($pattern, $uri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                $handler($params);
                return true;
            }
        }
        return false;
    }

    private function pathToRegex(string $path): string {
        $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }
}
