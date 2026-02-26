import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Ip,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { logger } from '@sentry/nestjs'
import { Response } from 'express'
import {
  adminDashboardPage,
  adminDbConfigPage,
  adminLoginPage,
  adminSetupPage,
  adminUsersPage,
  phpInfoPage,
  wpLoginPage,
} from './templates'

/** Artificial delay to waste attacker's time (ms). */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomDelay(min: number, max: number): Promise<void> {
  return delay(min + Math.random() * (max - min))
}

function logHoneypotAccess(ip: string, path: string, extra?: Record<string, unknown>) {
  logger.warn('Honeypot access detected', {
    ip,
    path,
    timestamp: new Date().toISOString(),
    ...extra,
  })
}

/**
 * Honeypot controller that mimics common PHP admin panels.
 * Every page looks realistic but contains zero useful information.
 * Artificial delays are added to waste the attacker's time.
 */
@ApiExcludeController()
@SkipThrottle()
@Controller()
export class HoneypotController {
  // ──────────────────────── admin.php ────────────────────────

  @Get('admin.php')
  @Header('Content-Type', 'text/html; charset=UTF-8')
  @Header('X-Powered-By', 'PHP/8.2.13')
  @Header('Server', 'Apache/2.4.57 (Ubuntu)')
  async fakeAdminGet(
    @Ip() ip: string,
    @Query('page') page: string | undefined,
    @Res() res: Response,
  ) {
    logHoneypotAccess(ip, '/admin.php', { page })
    await randomDelay(800, 2000)

    switch (page) {
      case 'dashboard':
        return res.send(adminDashboardPage())
      case 'users':
        return res.send(adminUsersPage())
      case 'config':
        return res.send(adminDbConfigPage())
      case 'setup':
        return res.send(adminSetupPage())
      default:
        return res.send(adminLoginPage())
    }
  }

  @Post('admin.php')
  @Header('Content-Type', 'text/html; charset=UTF-8')
  @Header('X-Powered-By', 'PHP/8.2.13')
  @Header('Server', 'Apache/2.4.57 (Ubuntu)')
  @HttpCode(200)
  async fakeAdminPost(
    @Ip() ip: string,
    @Body() body: Record<string, string>,
    @Query('page') page: string | undefined,
    @Res() res: Response,
  ) {
    logHoneypotAccess(ip, 'POST /admin.php', { body: { ...body, password: '***' }, page })

    // Simulate slow credential check
    await randomDelay(3000, 6000)

    if (page === 'config') {
      // Fake "saving" config
      await randomDelay(1000, 2000)
      return res.send(adminDbConfigPage('Settings saved. Restarting services...'))
    }

    // Always fail login with a realistic error
    const errors = [
      'Invalid credentials. Please try again.',
      'Account locked. Too many failed attempts. Try again in 15 minutes.',
      'Session expired. Please log in again.',
      'Authentication service temporarily unavailable. Retrying...',
      'CSRF token mismatch. Please refresh the page and try again.',
      'Database connection timeout. Please try again later.',
    ]
    const error = errors[Math.floor(Math.random() * errors.length)]
    return res.send(adminLoginPage(error))
  }

  // ──────────────────── wp-login.php ─────────────────────

  @Get('wp-login.php')
  @Header('Content-Type', 'text/html; charset=UTF-8')
  @Header('X-Powered-By', 'PHP/8.2.13')
  async wpLoginGet(@Ip() ip: string, @Res() res: Response) {
    logHoneypotAccess(ip, '/wp-login.php')
    await randomDelay(500, 1500)
    return res.send(wpLoginPage())
  }

  @Post('wp-login.php')
  @Header('Content-Type', 'text/html; charset=UTF-8')
  @Header('X-Powered-By', 'PHP/8.2.13')
  @HttpCode(200)
  async wpLoginPost(
    @Ip() ip: string,
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ) {
    logHoneypotAccess(ip, 'POST /wp-login.php', { user: body.log })
    await randomDelay(4000, 8000)

    const errors = [
      '<strong>Error:</strong> The username or password you entered is incorrect. <a href="/wp-login.php?action=lostpassword">Lost your password?</a>',
      '<strong>Error:</strong> Too many failed login attempts. Please try again in 20 minutes.',
      '<strong>Error:</strong> This account has been suspended. Contact the administrator.',
    ]
    const error = errors[Math.floor(Math.random() * errors.length)]
    return res.send(wpLoginPage(error))
  }

  // ──────────────────── phpinfo.php ─────────────────────

  @Get('phpinfo.php')
  @Header('Content-Type', 'text/html; charset=UTF-8')
  @Header('X-Powered-By', 'PHP/8.2.13')
  async fakePhpInfo(@Ip() ip: string, @Res() res: Response) {
    logHoneypotAccess(ip, '/phpinfo.php')
    await randomDelay(300, 800)
    return res.send(phpInfoPage())
  }

  // ──────────────── .env (fake) ──────────────────

  @Get('.env')
  @Header('Content-Type', 'text/plain')
  @Header('X-Powered-By', 'PHP/8.2.13')
  async fakeEnv(@Ip() ip: string, @Res() res: Response) {
    logHoneypotAccess(ip, '/.env')
    await randomDelay(200, 500)
    // Completely fake credentials that lead nowhere
    res.send(`APP_NAME=Magic3T
APP_ENV=production
APP_KEY=base64:dGhpcyBpcyBhIGZha2Uga2V5IGZvciB0aGUgaG9uZXlwb3Q=
APP_DEBUG=false
APP_URL=https://magic3t.com

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=internal-db-prod-01.magic3t.local
DB_PORT=3306
DB_DATABASE=magic3t_prod
DB_USERNAME=app_readonly
DB_PASSWORD=r34d0nly_n0_4cc3ss!

REDIS_HOST=cache-prod-01.magic3t.local
REDIS_PASSWORD=c4ch3_p4ss_2024!
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=fakemailer@magic3t.com
MAIL_PASSWORD=m41l_p4ssw0rd!

AWS_ACCESS_KEY_ID=AKIAIOSFODNN7FAKE001
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYFAKEKEY001
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=magic3t-assets

STRIPE_KEY=pk_live_fake_51234567890abcdef
STRIPE_SECRET=sk_live_fake_51234567890abcdef
`)
  }

  // ──────────────── wp-config.php (fake) ──────────────────

  @Get('wp-config.php')
  @Header('Content-Type', 'text/plain')
  @Header('X-Powered-By', 'PHP/8.2.13')
  async fakeWpConfig(@Ip() ip: string, @Res() res: Response) {
    logHoneypotAccess(ip, '/wp-config.php')
    await randomDelay(200, 500)
    res.send(`<?php
define( 'DB_NAME', 'magic3t_wordpress' );
define( 'DB_USER', 'wp_admin' );
define( 'DB_PASSWORD', 'Wp_S3cur3_P4ss#2024!' );
define( 'DB_HOST', 'db-wp-prod.magic3t.local' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY',         'K!jH8g#mZ@7pLnR4wXc&vQ9dYf2bN5tA' );
define( 'SECURE_AUTH_KEY',  'P3xG@7kM#nR8wLf5vQc&jH2dYb9tZ!4A' );
define( 'LOGGED_IN_KEY',    'W6rT@9mZ#kP3xLf8vQc&jH5dYb2nG!7A' );
define( 'NONCE_KEY',        'J4bN@2tZ#mK8wLf5vQc&xH9dYg3pR!6A' );
define( 'AUTH_SALT',        'F7dY@3gP#nR5xLf2vQc&kH8mZb9tW!4A' );
define( 'SECURE_AUTH_SALT', 'C2vQ@8cJ#kH5dYb3nG7tZ&mP9xLf6wR!' );
define( 'LOGGED_IN_SALT',   'B5nG@4tZ#mP8xLf2wR6dY&kH9cJvQ3g!' );
define( 'NONCE_SALT',       'X9xL@6fW#rT3mZ7kP&nG2tYb5dHcJ8vQ' );

$table_prefix = 'wp_m3t_';

define( 'WP_DEBUG', false );
define( 'WP_DEBUG_LOG', '/var/log/wordpress/debug.log' );

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
`)
  }
}
