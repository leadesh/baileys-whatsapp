const { response } = require("express");
const Package = require("../models/package");
const User = require("../models/user");
const { addMonths } = require("date-fns");

const stripe = require("stripe")(
  "sk_test_51ORoqxSH7ZBVqRJpo1g3BjeqfzW254DjSaHPOMoDPDRYS5SoI3RJMZx0gfAdrOvLs2rI2u8ab0G3qIJ8qe3kNXkW00iHB6xj5K"
);

exports.startStripeSession = async (req, res, next) => {
  try {
    const { packageSelected } = req.data;

    if (!packageSelected)
      throw new Error("First select package to make a payment request");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            unit_amount: packageSelected.rate * 100,
            currency: "INR",
            recurring: {
              interval: "month",
            },
            product_data: {
              name: packageSelected.name,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: packageSelected.id,
      },
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url: "http://localhost:5173?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:5173/signup",
    });

    // Redirect to the URL returned on the Checkout Session.
    // With express, you can redirect with:
    await Package.findByIdAndUpdate(packageSelected.id, {
      $set: { sessionId: session.id },
    });

    res.status(200).json({ session: session.url });
  } catch (error) {
    next(error);
  }
};

exports.paymentSuccessHandler = async (req, res, next) => {
  try {
    const { packageSelected } = req.data;
    if (!packageSelected)
      throw new Error("First select package to make a payment request");
    const session = await stripe.checkout.sessions.retrieve(
      packageSelected.sessionId
    );

    if (session.payment_status === "paid") {
      const subscriptionId = session.subscription;
      await Package.findByIdAndUpdate(packageSelected.id, {
        $set: { subscriptionId, subscriptionStatus: "paid" },
      });
      return res.status(200).json("Payment Successful");
    } else {
      return res.status(400).json("Payment Failure");
    }
  } catch (error) {
    next(error);
  }
};

exports.webHookHandler = async (req, res) => {
  const endpointSecret =
    "whsec_0ce64ed7afd9d09a90ddc2a7696713959a0f336bc0037a528bd74189b2aa85b2";

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  let userId;

  switch (eventType) {
    case "checkout.session.completed":
      // Payment is successful and the subscription is created.
      // You should provision the subscription and save the customer ID to your database.
      const customerId = event.data.object.customer;
      userId = event.data.object.metadata.userId;

      await Package.findByIdAndUpdate(userId, { customerId });
      break;
    case "invoice.paid":
      // Continue to provision the subscription as payments continue to be made.
      // Store the status in your database and check when a user accesses your service.
      // This approach helps you avoid hitting rate limits.
      userId = event.data.object.metadata.userId;
      const package = await Package.findById(userId);

      const todayTime = new Date();
      const startTime = todayTime.toISOString();

      package.startTime = startTime;

      let endDate = new Date(todayTime);
      endDate = addMonths(endDate, 1);
      package.endDate = endDate;
      await package.save();
      break;
    case "invoice.payment_failed":
      // The payment failed or the customer does not have a valid payment method.
      // The subscription becomes past_due. Notify your customer and send them to the
      // customer portal to update their payment information.
      break;
    default:
    // Unhandled event type
  }

  res.sendStatus(200);
};

exports.cancelSubscription = async (req, res, next) => {
  try {
    const { packageSelected } = req.data;

    if (
      !packageSelected?.subscriptionId ||
      packageSelected.subscriptionStatus !== "paid"
    ) {
      return res.status(404).json({ message: "No subscription to cancel" });
    }

    const subscription = await stripe.subscriptions.cancel(
      packageSelected.subscriptionId
    );

    await Package.findByIdAndDelete(packageSelected.id);
    const user = await User.findById(req.data.id);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

exports.createPortalHandler = async (req, res, next) => {
  try {
    const { session_id } = req.body;
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    // const returnUrl = YOUR_DOMAIN;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: checkoutSession.customer,
      return_url: returnUrl,
    });

    res.redirect(303, portalSession.url);
  } catch (error) {
    next(error);
  }
};
