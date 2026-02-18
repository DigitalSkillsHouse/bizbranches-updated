<?php

function registerProvincesRoutes(Router $router): void {
    $router->get('/api/provinces', function($params) {
        $provinces = [
            ['id' => 'punjab', 'name' => 'Punjab'],
            ['id' => 'sindh', 'name' => 'Sindh'],
            ['id' => 'kpk', 'name' => 'Khyber Pakhtunkhwa'],
            ['id' => 'balochistan', 'name' => 'Balochistan'],
            ['id' => 'ict', 'name' => 'Islamabad Capital Territory'],
            ['id' => 'gb', 'name' => 'Gilgit-Baltistan'],
            ['id' => 'ajk', 'name' => 'Azad Jammu & Kashmir'],
        ];
        Response::cached(['provinces' => $provinces], 's-maxage=86400, stale-while-revalidate=604800');
    });
}
