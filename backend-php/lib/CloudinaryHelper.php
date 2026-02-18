<?php

class CloudinaryHelper {
    public static function buildCdnUrl(?string $publicId): ?string {
        if (!$publicId || !env('CLOUDINARY_CLOUD_NAME')) return null;
        if (str_starts_with($publicId, 'http')) return $publicId;

        $cleanId = preg_replace('#^https?://res\.cloudinary\.com/[^/]+/image/upload/v?\d+/#', '', $publicId);
        $cleanId = preg_replace('#^https?://res\.cloudinary\.com/[^/]+/image/upload/#', '', $cleanId);
        $cleanId = preg_replace('/\.[^.\/]+$/', '', $cleanId);

        return 'https://res.cloudinary.com/' . env('CLOUDINARY_CLOUD_NAME') . '/image/upload/c_fit,w_200,h_200,q_auto,f_auto/' . $cleanId;
    }

    public static function upload(string $tmpFile): ?array {
        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');
        if (!$cloudName || !$apiKey || !$apiSecret) return null;

        $timestamp = time();
        $folder = 'citation/business-logos';
        $transformation = 'q_auto,f_auto,w_200,h_200,c_fit';

        $paramsToSign = "folder=$folder&timestamp=$timestamp&transformation=$transformation";
        $signature = sha1($paramsToSign . $apiSecret);

        $url = "https://api.cloudinary.com/v1_1/$cloudName/image/upload";

        $postFields = [
            'file' => new CURLFile($tmpFile),
            'folder' => $folder,
            'transformation' => $transformation,
            'timestamp' => $timestamp,
            'api_key' => $apiKey,
            'signature' => $signature,
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postFields,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            Logger::error('Cloudinary upload failed:', (string)$httpCode);
            return null;
        }

        $data = json_decode($response, true);
        if (!$data || !isset($data['secure_url'])) return null;

        return [
            'url' => $data['secure_url'],
            'public_id' => $data['public_id'],
        ];
    }
}
