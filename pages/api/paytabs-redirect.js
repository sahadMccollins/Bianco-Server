import nodemailer from "nodemailer";
import { IncomingForm } from 'formidable';
import axios from "axios";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("Bianco");


export default async function handler(req, res) {

    return res.status(405).end()

    console.log("reached here paytab callback");

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

    if (req.method !== 'POST') return res.status(405).end();

    const data = req.body;

    console.log("data", data)

    const {
        tran_ref,
        tran_total,
        cart_id,
        customer_details,
        transaction_amount,
        currency,
        payment_result,
    } = data;

    // if (payment_result.response_status !== 'A') {
    if (payment_result.response_status !== 'A') {
        return res.status(200).json({ message: 'Payment not approved' });
    }

    // 2️⃣ Find booking by cart_id
    const bookingInfo = await db.collection('bookings').findOne({ cartId: cart_id });

    if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
    }

    // 🧾 Sample booking data
    // const bookingInfo = {
    //     eventDate: "2025-06-01",
    //     guestRange: "50-70",
    //     startTime: "5 PM",
    //     endTime: "9 PM",
    //     emirate: "Dubai",
    //     areaLocality: "JLT",
    //     location: "Cluster C, Lake View Tower",
    //     flavours: "Vanilla, Chocolate",
    //     baseRate: "1000",
    //     additionalHourRate: "300",
    //     transportFee: "100",
    //     subTotal: "1400",
    //     vat: "70",
    //     totalAmount: "1470",
    // };

    // 🖼️ Optional: Embed logo
    const logoUrl = 'https://cdn.shopify.com/s/files/1/0677/0714/2393/files/1_Bianco_Italy_logo_8.png?v=1747808695'; // Change this to your logo URL
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 760;

    const drawText = (text, y, opts = {}) => {
        page.drawText(text, {
            x: opts.x || 50,
            y,
            size: opts.size || 12,
            font: opts.bold ? boldFont : font,
            color: rgb(0, 0, 0),
        });
    };

    // 🔗 Embed logo
    try {
        const logoImageBytes = await fetch(logoUrl).then((res) => res.arrayBuffer());
        const logoImage = await pdfDoc.embedPng(logoImageBytes);
        page.drawImage(logoImage, {
            x: 50,
            y: y - 40,
            width: 100,
            height: 40,
        });
    } catch (e) {
        console.warn("Logo embedding failed:", e.message);
    }

    y -= 60;
    drawText('Invoice for Private Event Booking', y, { bold: true, size: 14 }); y -= 30;

    drawText('Event Details:', y, { bold: true }); y -= 20;
    drawText(`Customer Email: ${customer_details.email}`, y); y -= 20;
    drawText(`Event Date: ${bookingInfo.eventDate}`, y); y -= 20;
    drawText(`Time: ${bookingInfo.startTime} - ${bookingInfo.endTime}`, y); y -= 20;
    drawText(`Guests: ${bookingInfo.guestRange}`, y); y -= 20;
    drawText(`Location: ${bookingInfo.emirate}, ${bookingInfo.areaLocality}`, y); y -= 20;
    drawText(`Address: ${bookingInfo.location}`, y); y -= 30;
    drawText(`Flavours: ${bookingInfo.flavours}`, y); y -= 20;

    drawText('Transaction Details:', y, { bold: true }); y -= 20;
    drawText(`Transaction ID: ${tran_ref}`, y); y -= 20;
    drawText(`Base Rate: AED ${bookingInfo.baseRate}`, y); y -= 20;
    drawText(`Additional Hour Rate: AED ${bookingInfo.additionalHourRate}`, y); y -= 20;
    drawText(`Transport Fee: AED ${bookingInfo.transportFee}`, y); y -= 20;
    drawText(`Subtotal: AED ${bookingInfo.subTotal}`, y); y -= 20;
    drawText(`VAT (5%): AED ${bookingInfo.vat}`, y); y -= 20;
    drawText(`Total Paid: AED ${tran_total}`, y, { bold: true }); y -= 40;

    drawText('Thank you for your booking!', y); y -= 20;
    drawText('For support, contact info@bianco-Italy.com', y, { size: 10 });

    const pdfBytes = await pdfDoc.save();

    // 📧 Email the PDF
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: customer_details.email || process.env.EMAIL_TO,
        subject: 'Your Private Event Booking Invoice',
        html: `<p>Dear Customer,</p>
           <p>Thank you for your payment. Your booking invoice is attached.</p>
           <p>Regards,<br>Bianco Italyy</p>`,
        attachments: [
            {
                filename: 'event-invoice.pdf',
                content: Buffer.from(pdfBytes),
                contentType: 'application/pdf',
            },
        ],
    });

    return res.status(200).json({ success: true, message: 'Invoice PDF sent.' });

}
