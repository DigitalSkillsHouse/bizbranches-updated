<?php

class GooglePing {
    public static function pingSitemap(): void {
        try {
            $siteUrl = rtrim(env('SITE_URL', env('NEXT_PUBLIC_SITE_URL', 'https://bizbranches.pk')), '/');
            $sitemapUrl = $siteUrl . '/sitemap.xml';
            $pingUrl = 'https://www.google.com/ping?sitemap=' . urlencode($sitemapUrl);

            $ctx = stream_context_create(['http' => ['timeout' => 5, 'method' => 'GET']]);
            @file_get_contents($pingUrl, false, $ctx);
            Logger::log('Google sitemap ping sent');
        } catch (Exception $e) {
            Logger::error('Sitemap ping failed:', $e->getMessage());
        }
    }
}
