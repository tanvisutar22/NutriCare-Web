import nodemailer from "nodemailer";

const Email = async (email, subject, content) => {
  let mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD, // App Password
    },
  });

  let mailDetails = {
    from: process.env.EMAIL,
    to: email,
    subject: subject,
    text: content,
  };

  mailTransporter.sendMail(mailDetails, (err, data) => {
    if (err) {
      console.log("Error Occurs: " + err);
    } else {
      console.log("Successfully data sent" + data);
      return true;
    }
  });
};
export default Email;
