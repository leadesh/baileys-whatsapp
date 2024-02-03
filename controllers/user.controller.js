const User = require("../models/user");
const sendEmail = require("../sendEmail");


exports.reseatPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new ErrorHandler("user not found", 404));
        }

        const message = `Your Password is :-  ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it`;

        try {
            await sendEmail({
                email: user.email,
                subject: "Leadesh Password Recovery",
                message: message
            });

            res.status(200).json({
                success: true,
                message: `Email sent to ${user.email} successfully`,
            })
        } catch (error) {
            console.log(err);
            next(error)
        }
    }
    catch (error) {
        next(error);
    }
}