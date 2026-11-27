# Laravel API: PHP-FPM + nginx (serversideup/php). Build from the repo root:
#   docker build -f deploy/api.Dockerfile -t grid-api .
FROM serversideup/php:8.3-fpm-nginx-alpine-v5.0.2

USER root
RUN install-php-extensions intl bcmath exif \
    && printf 'client_max_body_size 110m;\n' > /etc/nginx/conf.d/upload-size.conf
USER www-data

WORKDIR /var/www/html

# Dependencies first, so code changes reuse this layer.
COPY --chown=www-data:www-data backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress

COPY --chown=www-data:www-data backend/ ./
RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi \
    && mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

# A carousel may send ten 10 MB files. Laravel boots on /up.
ENV HEALTHCHECK_PATH=/up \
    SSL_MODE=off \
    PHP_OPCACHE_ENABLE=1 \
    PHP_UPLOAD_MAX_FILE_SIZE=110M \
    PHP_POST_MAX_SIZE=110M
