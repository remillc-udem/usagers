import { promises as fsp } from 'fs'
import { join } from 'path'
import nodemailer from 'nodemailer'
import { htmlToText } from 'nodemailer-html-to-text'
import inlineBase64 from 'nodemailer-plugin-inline-base64'
import console from './console'
import config from 'config'

const mailerConfig = config.get('mailer');

// create reusable transporter object using the default SMTP transport
export const mailer = nodemailer.createTransport({
  ...mailerConfig.smtp,
  secure: false, // true for 465, false for other ports
});

mailer.use('compile', htmlToText()); // Generate text version
mailer.use('compile', inlineBase64({ cidPrefix: 'bib_' })); // Inline images using CID-referenced attachment

export async function sendConfirmMail(to) {
  return new Promise(async (resolve, reject) => {
    try {
      const emailTemplate = await fsp.readFile(join(__dirname, '..', '..', 'template', 'email.html'), 'utf8');
      await mailer.sendMail({
        from: mailerConfig.from, // sender address
        to, // list of receivers
        bcc: '"Christian Rémillard" <christian.remillard@umontreal.ca>',
        subject: "Confirmation de création de compte", // Subject line
        html: emailTemplate // html body
      })
        .then((info) => {
          resolve(info)
        })
        .catch(err => {
          console.error(err)
          reject(err)
        });
    } catch (e) {
      console.error(e)
      reject(e)
    }

  })
}

export async function sendErrorMail(to) {
  return new Promise(async (resolve, reject) => {
    mailer.sendMail({
      from: mailerConfig.from, // sender address
      to, // list of receivers
      subject: "Error...", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>" // html body
    })
      .then(resolve)
      .catch(err => {
        console.error(err)
        reject(err)
      });

  })
}

//
// ====================================================
//

if (process.mainModule.filename === __filename) {

  async function main() {
    // send mail with defined transport object
    let info = await sendConfirmMail('toto.titi@umontreal.ca');

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  }

  main().catch(console.error)
}