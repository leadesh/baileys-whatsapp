exports.startStripeSession = async (req, res, next) => {
  try {
    const { packageSelected } = req.data;

    const lineItems = packageSelected.map((product) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: product.name,
        },
        unit_amount: product.rate,
      },
      quantity: 1,
    }));
  } catch (error) {
    next(error);
  }
};
