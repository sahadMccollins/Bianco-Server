import { IncomingForm } from 'formidable';

// Disable default body parsing from Next.js for form-data
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    console.log("PayTab return endpoint hit");
    console.log("Method:", req.method);
    console.log("Headers:", req.headers);
    console.log("URL:", req.url);

    const form = new IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error("Error parsing form data:", err);
            return res.status(500).send("Error parsing data");
        }

        console.log("Parsed fields:", fields);

        const respStatus = fields.respStatus?.[0];

        if (respStatus === 'A') {
            // Payment successful
            // return res.redirect(302, 'https://6448b5-4.myshopify.com/pages/thank-you');
            return res.redirect(302, process.env.THANKYOU_PAGE);
        } else {
            // Payment failed
            // return res.redirect(302, 'https://6448b5-4.myshopify.com');
            return res.redirect(302, process.env.HOMEPAGE);
        }
    });
}
