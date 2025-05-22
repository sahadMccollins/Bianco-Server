import nodemailer from "nodemailer";
import { IncomingForm } from 'formidable';
import axios from "axios";

export const config = {
    api: {
        bodyParser: false, // Required for formidable
    },
};

export default async function handler(req, res) {

    console.log("reached here");

    // Handle preflight request (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Allow CORS for actual requests
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Only allow POST method
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    // Parse the form
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Form parsing error:', err);
            return res.status(500).json({ error: 'Form parsing error' });
        }

        console.log("Parsed fields:", fields);

        const {
            eventDate,
            guestRange,
            startTime,
            endTime,
            location,
            additionalHours,
            brandingNotes,
            baseRate,
            additionalHourRate,
            currency,
            totalAmount
        } = fields;

        // Prepare attachments array if any files uploaded
        const attachments = [];
        if (files.brandingAssets) {
            const fileArray = Array.isArray(files.brandingAssets) ? files.brandingAssets : [files.brandingAssets];
            for (const file of fileArray) {
                attachments.push({
                    filename: file.originalFilename || file.newFilename,
                    path: file.filepath,
                });
            }
        }

        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_FROM,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: process.env.EMAIL_TO,
                subject: "New Private Event Booking",
                html: `
              <h3>Private Event Booking</h3>
              <p><strong>Event Date:</strong> ${eventDate}</p>
              <p><strong>Guest Range:</strong> ${guestRange}</p>
              <p><strong>Start Time:</strong> ${startTime}</p>
              <p><strong>End Time:</strong> ${endTime}</p>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Additional Hours:</strong> ${additionalHours}</p>
              <p><strong>Branding Notes:</strong> ${brandingNotes || 'N/A'}</p>
              <p><strong>Base Rate:</strong> ${baseRate || 'N/A'}</p>
              <p><strong>Additional Hour Rate:</strong> ${additionalHourRate || 'N/A'}</p>
              <p><strong>Currency:</strong> ${currency || 'N/A'}</p>
              <p><strong>Total Amount:</strong> ${totalAmount || 'N/A'}</p>
            `,
                attachments,
            });

            const cartId = `cart_${Date.now()}`;

            const paytabsRes = await axios.post(
                "https://secure.paytabs.com/payment/request",
                {
                    profile_id: process.env.PAYTABS_PROFILE_ID,
                    tran_type: "sale",
                    tran_class: "ecom",
                    cart_id: cartId,
                    cart_description: "Private Event Booking",
                    cart_currency: "AED",
                    cart_amount: Number(totalAmount),
                    callback: process.env.RETURN_URL,
                    return: process.env.RETURN_URL,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        authorization: process.env.PAYTABS_SERVER_KEY,
                    },
                }
            );

            console.log("pytab", paytabsRes);

            const paymentLink = paytabsRes.data.redirect_url;

            res.status(200).json({ success: true, paymentLink });

            // res.status(200).json({ success: true, message: "Booking received" });
        } catch (err) {
            console.error("Email sending error:", err);
            res.status(500).json({ error: "Server Error" });
        }
    });
}
