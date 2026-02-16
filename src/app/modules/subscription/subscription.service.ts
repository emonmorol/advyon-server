/**
 * @fileoverview Subscription service layer.
 * Manages Stripe checkout, subscription CRUD, portal sessions,
 * plan retrieval, and subscription cancellation.
 */
import httpStatus from 'http-status';
import { User } from '../user/user.model';
import { Subscription } from './subscription.model';
import { PLAN_CONFIGS, SUBSCRIPTION_ERROR_MESSAGES } from './subscription.constant';
import { ICheckoutSessionRequest, TPlanTier, TBillingInterval } from './subscription.interface';
import { stripe } from '../../config/stripe.config';
import AppError from '../../errors/appError';

/**
 * Get all available subscription plans.
 */
const getPlans = () => {
  return Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
    id: key,
    ...config,
  }));
};

/**
 * Get the current user's subscription.
 */
const getUserSubscription = async (userId: string) => {
  const user = await User.findOne({ id: userId });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

  const subscription = await Subscription.findOne({
    user: user._id,
    status: { $in: ['active', 'trialing', 'past_due'] },
  });

  if (!subscription) {
    return {
      plan: 'free',
      status: 'active',
      billingInterval: 'month',
      features: PLAN_CONFIGS.free.features,
    };
  }

  return subscription;
};

/**
 * Create a Stripe Checkout session for subscribing to a plan.
 */
const createCheckoutSession = async (
  userId: string,
  payload: ICheckoutSessionRequest,
) => {
  if (!stripe) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      SUBSCRIPTION_ERROR_MESSAGES.STRIPE_NOT_CONFIGURED,
    );
  }

  const user = await User.findOne({ id: userId });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

  const planConfig = PLAN_CONFIGS[payload.plan as TPlanTier];
  if (!planConfig || payload.plan === 'free') {
    throw new AppError(httpStatus.BAD_REQUEST, SUBSCRIPTION_ERROR_MESSAGES.PLAN_NOT_FOUND);
  }

  // Check for existing active subscription
  const existingSub = await Subscription.findOne({
    user: user._id,
    plan: payload.plan,
    status: { $in: ['active', 'trialing'] },
  });
  if (existingSub) {
    throw new AppError(httpStatus.CONFLICT, SUBSCRIPTION_ERROR_MESSAGES.ALREADY_SUBSCRIBED);
  }

  // Get or create Stripe customer
  let stripeCustomerId: string;
  const existingCustomerSub = await Subscription.findOne({ user: user._id });
  if (existingCustomerSub?.stripeCustomerId) {
    stripeCustomerId = existingCustomerSub.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: { userId: user._id.toString(), advyonId: user.id },
    });
    stripeCustomerId = customer.id;
  }

  const priceAmount =
    payload.billingInterval === 'year'
      ? planConfig.yearlyPrice
      : planConfig.monthlyPrice;

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${planConfig.name} Plan`,
            description: planConfig.features.join(', '),
          },
          unit_amount: priceAmount,
          recurring: {
            interval: payload.billingInterval,
          },
        },
        quantity: 1,
      },
    ],
    success_url: payload.successUrl,
    cancel_url: payload.cancelUrl,
    metadata: {
      userId: user._id.toString(),
      plan: payload.plan,
      billingInterval: payload.billingInterval,
    },
    subscription_data: {
      metadata: {
        userId: user._id.toString(),
        plan: payload.plan,
      },
    },
  });

  return { sessionId: session.id, url: session.url };
};

/**
 * Create a Stripe Customer Portal session for managing billing.
 */
const createPortalSession = async (userId: string, returnUrl: string) => {
  if (!stripe) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      SUBSCRIPTION_ERROR_MESSAGES.STRIPE_NOT_CONFIGURED,
    );
  }

  const user = await User.findOne({ id: userId });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

  const subscription = await Subscription.findOne({
    user: user._id,
    stripeCustomerId: { $exists: true },
  });

  if (!subscription?.stripeCustomerId) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      SUBSCRIPTION_ERROR_MESSAGES.NO_ACTIVE_SUBSCRIPTION,
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return { url: session.url };
};

/**
 * Cancel a user's subscription (at period end).
 */
const cancelSubscription = async (userId: string) => {
  if (!stripe) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      SUBSCRIPTION_ERROR_MESSAGES.STRIPE_NOT_CONFIGURED,
    );
  }

  const user = await User.findOne({ id: userId });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

  const subscription = await Subscription.findOne({
    user: user._id,
    status: { $in: ['active', 'trialing'] },
  });

  if (!subscription?.stripeSubscriptionId) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      SUBSCRIPTION_ERROR_MESSAGES.NO_ACTIVE_SUBSCRIPTION,
    );
  }

  // Cancel at period end (not immediate)
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  subscription.cancelAtPeriodEnd = true;
  await subscription.save();

  return subscription;
};

export const SubscriptionService = {
  getPlans,
  getUserSubscription,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
};
