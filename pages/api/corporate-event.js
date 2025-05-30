import { IncomingForm } from 'formidable';
import nodemailer from 'nodemailer';

export const config = {
    api: {
        bodyParser: false, // Required for formidable
    },
};

export default async function handler(req, res) {
    console.log("its reaching");

    // Handle preflight (CORS)
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

    // Only allow POST
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
            fullName,
            email,
            mobile,
            companyName,
            guestRange,
            eventDate,
            startTime,
            endTime,
            additionalHours,
            emirate,
            areaLocality,
            location,
            brandingNotes,
            flavours
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
                subject: "New Corporate Event Booking",
                html: `
          <h3>Corporate Event Booking</h3>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${mobile}</p>
          <p><strong>Company:</strong> ${companyName}</p>
          <p><strong>Guest Range:</strong> ${guestRange}</p>
          <p><strong>Event Date:</strong> ${eventDate}</p>
          <p><strong>Start Time:</strong> ${startTime}</p>
          <p><strong>End Time:</strong> ${endTime}</p>
          <p><strong>Additional Hours:</strong> ${additionalHours}</p>
          <p><strong>Emirate:</strong> ${emirate}</p>
          <p><strong>Area / Locality:</strong> ${areaLocality}</p>
          <p><strong>Full Address:</strong> ${location}</p>
          <p><strong>Flavours:</strong> ${flavours}</p>
          <p><strong>Branding Notes:</strong> ${brandingNotes || 'N/A'}</p>
        `,
                attachments,
            });


            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: "Event Booking Confirmation - Bianco Italy",
                html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Event Booking Confirmation</title>
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Montserrat', sans-serif; background-color: #f9f9f9;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
                        <!-- Header with Logo -->
                        <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 3px solid #bdbf82;">
                            <img src="https://cdn.shopify.com/s/files/1/0677/0714/2393/files/1_Bianco_Italy_logo_8.png?v=1747808695" alt="Bianco Italy" style="max-width: 200px; height: auto;">
                        </div>
                        
                        <!-- Banner -->
                        <div style="background-color: #bdbf82; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">BOOKING CONFIRMED</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; font-weight: 300; letter-spacing: 0.5px;">Thank you for choosing Bianco Italy</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <div style="margin-bottom: 30px;">
                                <h2 style="color: #333333; margin: 0 0 15px 0; font-size: 22px; font-weight: 500;">Dear ${fullName},</h2>
                                <p style="color: #666666; line-height: 1.6; margin: 0; font-size: 16px;">
                                    We're delighted to confirm your corporate event booking with Bianco Italy. Our team has received your request and is already preparing to make your event exceptional.
                                </p>
                            </div>
                            
                            <!-- Event Details Card -->
                            <div style="background-color: #ffffff; border-radius: 8px; padding: 25px; margin-bottom: 30px; border: 1px solid #eeeeee; border-left: 4px solid #bdbf82;">
                                <h3 style="color: #bdbf82; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center; font-weight: 600;">
                                    EVENT DETAILS
                                </h3>
                                
                                <div style="display: grid; gap: 12px;">
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #666666; font-weight: 500;">Company:</span>
                                        <span style="color: #333333; font-weight: 600;">${companyName}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #666666; font-weight: 500;">Event Date:</span>
                                        <span style="color: #333333; font-weight: 600;">${eventDate}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #666666; font-weight: 500;">Time:</span>
                                        <span style="color: #333333; font-weight: 600;">${startTime} - ${endTime}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #666666; font-weight: 500;">Guest Count:</span>
                                        <span style="color: #333333; font-weight: 600;">${guestRange}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #666666; font-weight: 500;">Location:</span>
                                        <span style="color: #333333; font-weight: 600;">${emirate}, ${areaLocality}</span>
                                    </div>
                                    ${additionalHours ? `
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #666666; font-weight: 500;">Additional Hours:</span>
                                        <span style="color: #333333; font-weight: 600;">${additionalHours}</span>
                                    </div>
                                    ` : ''}
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                        <span style="color: #666666; font-weight: 500;">Selected Flavours:</span>
                                        <span style="color: #333333; font-weight: 600;">${flavours}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Next Steps -->
                            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #bdbf82;">
                                <h3 style="color: #bdbf82; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center; font-weight: 600;">
                                    WHAT'S NEXT
                                </h3>
                                <ul style="color: #666666; line-height: 1.6; margin: 0; padding-left: 20px;">
                                    <li style="margin-bottom: 10px;">Our event coordinator will contact you within 24 hours</li>
                                    <li style="margin-bottom: 10px;">We'll discuss menu customization and special requirements</li>
                                    <li style="margin-bottom: 10px;">A detailed quote will be provided for your approval</li>
                                </ul>
                            </div>
                            
                            <!-- Contact Info -->
                            <div style="text-align: center; padding: 25px; background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 8px;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">Need to make changes or have questions?</h3>
                                <p style="color: #666666; margin: 0 0 15px 0;">Contact our event team:</p>
                                <div style="display: inline-block; background-color: #bdbf82; color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: 500; letter-spacing: 0.5px;">
                                    📞 +971 44569755 | 📧 info@bianco-italy.com
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #333333; padding: 30px; text-align: center;">
                            <p style="color: #bdbf82; margin: 0 0 10px 0; font-size: 16px; font-weight: 500;">
                                BIANCO ITALY
                            </p>
                            <p style="color: #ffffff; margin: 0 0 20px 0; font-size: 14px;">
                                Authentic Italian Flavors for Your Special Events
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                This is an automated confirmation email. Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                `,
            });

            res.status(200).json({ success: true, message: "Booking received" });
        } catch (err) {
            console.error("Email sending error:", err);
            res.status(500).json({ error: "Server Error" });
        }
    });
}
