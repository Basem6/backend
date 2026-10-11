require("dotenv").config();
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_KEY);

async function sendEmail({ to, subject, html }) {
    const { data, error } = await resend.emails.send({
        from: "Hemma <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

module.exports = sendEmail;