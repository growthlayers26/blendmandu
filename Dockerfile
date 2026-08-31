FROM php:8.2-apache

# Install required extensions and tools for Bagisto
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    default-mysql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo_mysql zip mbstring tokenizer intl bcmath \
    && a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy application source code
COPY . /var/www/html

# Ensure proper permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

# The base image's default CMD runs Apache in the foreground
