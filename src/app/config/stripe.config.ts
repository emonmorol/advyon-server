/**
 * @fileoverview Server-side Stripe SDK configuration.
 * Initializes the Stripe client with the secret key from environment.
 * All Stripe operations should import the instance from this module.
 */
import Stripe from 'stripe';
import config from '../config';

const STRIPE_SECRET_KEY = config.stripe_secret_key || process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn(
    '[Stripe] STRIPE_SECRET_KEY is not set. Payment features will be unavailable.',
  );
}

/**
 * Singleton Stripe SDK instance.
 * Configured with API version 2024-12-18.acacia for stability.
 */
export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
      typescript: true,
    })
  : null;

export const STRIPE_WEBHOOK_SECRET =
  config.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || '';
