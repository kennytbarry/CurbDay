import nodemailer, { type Transporter } from "nodemailer";
import fs from "fs";
import path from "path";
import { extractStreetAddress } from "@/lib/esd";

let transporter: Transporter | null = null;

function getBannerAttachment(): { attachment: { filename: string; path: string; cid: string } | null; imgSrc: string } {
  const bannerPath = path.join(process.cwd(), "public/images/email-banner.png");
  if (fs.existsSync(bannerPath)) {
    return {
      attachment: {
        filename: "curbday-banner.png",
        path: bannerPath,
        cid: "curbday-banner",
      },
      imgSrc: "cid:curbday-banner",
    };
  }
  return {
    attachment: null,
    imgSrc: "https://curbday-sd.vercel.app/images/email-banner.png",
  };
}

function getCartIconAttachments(recyclingActive: boolean): {
  attachments: Array<{ filename: string; path: string; cid: string }>;
  trashImgSrc: string;
  organicsImgSrc: string;
  recycleImgSrc: string;
} {
  const imagesDir = path.join(process.cwd(), "public/images");
  const trashPath = path.join(imagesDir, "cart-trash.png");
  const organicsPath = path.join(imagesDir, "cart-organics.png");
  const recyclePath = path.join(imagesDir, "cart-recycle.png");

  const attachments: Array<{ filename: string; path: string; cid: string }> = [];

  let trashImgSrc = "https://curbday-sd.vercel.app/images/cart-trash.png";
  if (fs.existsSync(trashPath)) {
    attachments.push({
      filename: "cart-trash.png",
      path: trashPath,
      cid: "cart-trash",
    });
    trashImgSrc = "cid:cart-trash";
  }

  let organicsImgSrc = "https://curbday-sd.vercel.app/images/cart-organics.png";
  if (fs.existsSync(organicsPath)) {
    attachments.push({
      filename: "cart-organics.png",
      path: organicsPath,
      cid: "cart-organics",
    });
    organicsImgSrc = "cid:cart-organics";
  }

  let recycleImgSrc = "https://curbday-sd.vercel.app/images/cart-recycle.png";
  if (recyclingActive && fs.existsSync(recyclePath)) {
    attachments.push({
      filename: "cart-recycle.png",
      path: recyclePath,
      cid: "cart-recycle",
    });
    recycleImgSrc = "cid:cart-recycle";
  }

  return {
    attachments,
    trashImgSrc,
    organicsImgSrc,
    recycleImgSrc,
  };
}

function getTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user.replace(/\s+/g, ""),
        pass: pass.replace(/\s+/g, ""),
      },
    });
  }

  return transporter;
}

function getFromAddress(): string {
  const email = process.env.GMAIL_USER || "notifications@curbday-sd.vercel.app";
  return `"CurbDay San Diego" <${email}>`;
}

export interface SendReminderOptions {
  to: string;
  address: string;
  carts: string;
  recyclingActive: boolean;
  unsubscribeUrl: string;
  oneClickUnsubUrl: string;
}

export interface SendHolidayAlertOptions {
  to: string;
  address: string;
  holidayName: string;
  unsubscribeUrl: string;
  oneClickUnsubUrl: string;
}

export interface SendVerificationOptions {
  to: string;
  address: string;
  verifyUrl: string;
  mode?: "collection" | "street_sweeping";
  sweepingDetails?: {
    street: string;
    blockRange?: string | null;
    timeWindow?: string | null;
    frequency?: string | null;
    sides?: string | null;
  };
}

export interface SendStreetSweepingReminderOptions {
  to: string;
  address: string;
  street: string;
  blockRange?: string | null;
  timeWindow?: string | null;
  sides?: string | null;
  frequency?: string | null;
  unsubscribeUrl: string;
  oneClickUnsubUrl: string;
}

export async function sendWeeklyReminder(options: SendReminderOptions): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("Gmail SMTP transporter not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).");
    return false;
  }

  const { attachment: bannerAttachment, imgSrc: bannerImgSrc } = getBannerAttachment();
  const { attachments: iconAttachments, trashImgSrc, organicsImgSrc, recycleImgSrc } =
    getCartIconAttachments(options.recyclingActive);

  const attachments = [
    ...(bannerAttachment ? [bannerAttachment] : []),
    ...iconAttachments,
  ];

  const displayAddress = extractStreetAddress(options.address);
  const subject = `CurbDay Reminder: ${options.carts} for ${displayAddress}`;
  const previewText = `Tomorrow is collection day. Roll carts to the curb tonight before 6:00 AM.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #FAF7F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #FAF7F0; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText}
  </div>

  <div style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border: 2px solid rgba(19, 122, 116, 0.22); border-left: 6px solid #137A74; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 36px rgba(19, 122, 116, 0.08);">
    <!-- Flip7 Retro Solid Teal Header Accent -->
    <div style="height: 5px; background-color: #137A74;"></div>
    
    <div style="padding: 28px 24px;">
      <!-- Website-Mirrored Header Banner (Instant CID load) -->
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${bannerImgSrc}" alt="CurbDay San Diego" width="460" style="display: block; width: 100%; max-width: 460px; height: auto; margin: 0 auto; border: 0;" />
      </div>

      <!-- Configured Address Badge -->
      <div style="background-color: #FAF7F0; border: 1.5px solid rgba(19, 122, 116, 0.22); border-radius: 14px; padding: 10px 14px; margin-bottom: 18px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #137A74; margin-bottom: 2px;">Collection Address</div>
        <div style="font-size: 16px; font-weight: 800; color: #1C2826;">${displayAddress}</div>
      </div>

      <!-- Main Headline & Subtitle -->
      <h1 style="font-size: 22px; font-weight: 900; color: #1C2826; margin: 0 0 4px 0; line-height: 1.25;">Tomorrow is Collection Day</h1>
      <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 16px 0;">
        Roll carts to the curb tonight before <strong>6:00 AM</strong>.
      </p>

      <!-- Recycling Status Pill -->
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 800; ${
          options.recyclingActive
            ? "background-color: #EFF8F7; border: 1.5px solid #137A74; color: #094B48;"
            : "background-color: #F1F5F9; border: 1.5px solid #CBD5E1; color: #475569;"
        }">
          ${options.recyclingActive ? "♻️ Recycling goes out this week" : "⏸️ Recycling stays in this week"}
        </span>
      </div>

      <!-- Carts Card -->
      <div style="background-color: #FAF7F0; border: 1.5px solid rgba(19, 122, 116, 0.22); border-radius: 16px; padding: 16px 18px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #137A74; margin-bottom: 12px;">Carts for Tomorrow</div>
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <!-- Trash Row -->
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px dashed rgba(19, 122, 116, 0.2);">
              <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                  <td valign="middle" style="width: 32px; padding-right: 12px;">
                    <img src="${trashImgSrc}" alt="Trash" width="32" height="32" style="display: block; border-radius: 8px; width: 32px; height: 32px;" />
                  </td>
                  <td valign="middle">
                    <div style="font-size: 14px; font-weight: 800; color: #1C2826; line-height: 1.2;">Black Cart: Trash</div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Landfill refuse &amp; non-recyclables</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Organics Row -->
          <tr>
            <td style="padding: 8px 0; ${options.recyclingActive ? "border-bottom: 1px dashed rgba(19, 122, 116, 0.2);" : ""}">
              <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                  <td valign="middle" style="width: 32px; padding-right: 12px;">
                    <img src="${organicsImgSrc}" alt="Organics" width="32" height="32" style="display: block; border-radius: 8px; width: 32px; height: 32px;" />
                  </td>
                  <td valign="middle">
                    <div style="font-size: 14px; font-weight: 800; color: #059669; line-height: 1.2;">Green Cart: Organics</div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Food scraps &amp; yard trimmings</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            options.recyclingActive
              ? `
          <!-- Recycling Row (Only shown when active) -->
          <tr>
            <td style="padding: 8px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                  <td valign="middle" style="width: 32px; padding-right: 12px;">
                    <img src="${recycleImgSrc}" alt="Recycling" width="32" height="32" style="display: block; border-radius: 8px; width: 32px; height: 32px;" />
                  </td>
                  <td valign="middle">
                    <div style="font-size: 14px; font-weight: 800; color: #2563EB; line-height: 1.2;">Blue Cart: Recycling</div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Bottles, cans, paper &amp; clean cardboard</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      <!-- Placement Tip -->
      <div style="background-color: #FFFFFF; border: 1.5px solid rgba(19, 122, 116, 0.22); border-radius: 12px; padding: 12px 14px; margin-bottom: 22px; font-size: 12px; color: #475569; line-height: 1.5;">
        💡 <strong>Curb Tip:</strong> Place carts with wheels against the curb and leave 3 feet of space between carts and parked cars.
      </div>

      <!-- Footer & Unsubscribe -->
      <div style="padding-top: 16px; border-top: 1px solid rgba(19, 122, 116, 0.15); font-size: 11px; line-height: 1.6; color: #64748B; text-align: center;">
        <p style="margin: 0 0 6px 0;">You received this email because you subscribed to collection reminders for <strong>${displayAddress}</strong>.</p>
        <p style="margin: 0;">
          <a href="${options.unsubscribeUrl}" style="color: #137A74; text-decoration: underline; font-weight: 700;">Unsubscribe with one click</a> • 
          <a href="https://curbday-sd.vercel.app" style="color: #137A74; text-decoration: underline; font-weight: 700;">View Live Schedule on CurbDay</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

  try {
    const fromAddress = getFromAddress();
    await mailer.sendMail({
      from: fromAddress,
      to: options.to,
      replyTo: `"CurbDay Reminders" <no-reply@curbday-sd.vercel.app>`,
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<${options.oneClickUnsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      attachments,
    });
    return true;
  } catch (err) {
    console.error("Gmail send error:", err);
    return false;
  }
}

export async function sendHolidayAlert(options: SendHolidayAlertOptions): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("Gmail SMTP transporter not configured.");
    return false;
  }

  const { attachment, imgSrc } = getBannerAttachment();
  const attachments = attachment ? [attachment] : [];

  const displayAddress = extractStreetAddress(options.address);
  const subject = `Holiday Delay: No collection tomorrow for ${displayAddress} (${options.holidayName})`;
  const previewText = `Collection delayed +1 day due to ${options.holidayName}. Keep your carts off the curb tonight.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 28px 12px; background-color: #FAF7F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #FAF7F0; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText}
  </div>

  <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 2px solid rgba(255, 210, 63, 0.45); border-left: 6px solid #FFD23F; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 36px rgba(19, 122, 116, 0.08);">
    <!-- Flip7 Gold Accent Bar -->
    <div style="height: 5px; background-color: #FFD23F;"></div>
    
    <div style="padding: 32px 26px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${imgSrc}" alt="CurbDay San Diego" width="480" style="display: block; width: 100%; max-width: 480px; height: auto; margin: 0 auto; border: 0;" />
      </div>

      <div style="background-color: #FAF7F0; border: 1.5px solid rgba(19, 122, 116, 0.22); border-radius: 14px; padding: 12px 16px; margin-bottom: 22px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #137A74; margin-bottom: 2px;">Collection Address</div>
        <div style="font-size: 15px; font-weight: 800; color: #1C2826;">${displayAddress}</div>
      </div>

      <div style="background-color: #FFFDF5; border: 2px solid #FFD23F; border-radius: 16px; padding: 22px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #D97706; margin-bottom: 6px;">📅 City Holiday Schedule Delay</div>
        <h1 style="font-size: 20px; font-weight: 900; color: #1C2826; margin: 0 0 10px 0; line-height: 1.3;">No Collection Tomorrow (${options.holidayName})</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 14px 0;">
          The City of San Diego Environmental Services Department (ESD) observes <strong>${options.holidayName}</strong>. Curbside collection is <strong>delayed by +1 day</strong> for the remainder of this week.
        </p>
        <div style="padding: 12px 16px; background-color: #FEF3C7; border-radius: 12px; font-size: 13px; font-weight: 700; color: #92400E; border: 1.5px solid rgba(217, 119, 6, 0.3);">
          ⚠️ <strong>Action Needed:</strong> Keep your carts off the curb tonight. Put them out tomorrow evening instead!
        </div>
      </div>

      <div style="padding-top: 18px; border-top: 1px solid rgba(19, 122, 116, 0.15); font-size: 11px; line-height: 1.6; color: #64748B; text-align: center;">
        <p style="margin: 0 0 6px 0;">You received this email because you subscribed to weekly collection reminders for <strong>${displayAddress}</strong>.</p>
        <p style="margin: 0;">
          <a href="${options.unsubscribeUrl}" style="color: #137A74; text-decoration: underline; font-weight: 700;">Unsubscribe with one click</a> • 
          <a href="https://curbday-sd.vercel.app" style="color: #137A74; text-decoration: underline; font-weight: 700;">View Live Schedule on CurbDay</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

  try {
    const fromAddress = getFromAddress();
    await mailer.sendMail({
      from: fromAddress,
      to: options.to,
      replyTo: `"CurbDay Reminders" <no-reply@curbday-sd.vercel.app>`,
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<${options.oneClickUnsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      attachments,
    });
    return true;
  } catch (err) {
    console.error("Gmail send error:", err);
    return false;
  }
}

export async function sendVerificationEmail(options: SendVerificationOptions): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("Gmail SMTP transporter not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).");
    return false;
  }

  const { attachment, imgSrc } = getBannerAttachment();
  const attachments = attachment ? [attachment] : [];

  const isSweeping = options.mode === "street_sweeping";
  const cleanAddress = extractStreetAddress(options.address);
  const displayAddress = isSweeping && options.sweepingDetails
    ? `${options.sweepingDetails.street}${options.sweepingDetails.blockRange ? ` (${options.sweepingDetails.blockRange})` : ""}`
    : cleanAddress;

  const subject = isSweeping
    ? `Confirm "Move Your Car" street sweeping reminders for ${displayAddress}`
    : `Confirm your weekly CurbDay reminders for ${displayAddress}`;
  const previewText = isSweeping
    ? `Click to activate your 6:00 PM street sweeping reminders for ${displayAddress}.`
    : `Click to activate your 6:00 PM weekly collection reminders for ${displayAddress}.`;

  const headline = isSweeping ? 'Confirm "Move Your Car" Reminders' : "Confirm Your Weekly Reminders";
  const eyebrow = isSweeping ? "Street Sweeping Confirmation" : "Subscription Confirmation";
  const addressBadgeTitle = isSweeping ? "Sweeping Route Block" : "Collection Address";
  const bodyText = isSweeping
    ? `You're one click away from street sweeping alerts. We'll email you at <strong>6:00 PM the evening before sweeping</strong> so you have plenty of time to move your vehicle${options.sweepingDetails?.timeWindow ? ` before <strong>${options.sweepingDetails.timeWindow}</strong>` : ""} and avoid a parking citation.`
    : `You're one click away from weekly curbside pickup alerts. We'll email you at <strong>6:00 PM the evening before</strong> pickup with exactly which carts go out.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 28px 12px; background-color: #FAF7F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #FAF7F0; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText}
  </div>

  <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 2px solid rgba(19, 122, 116, 0.22); border-left: 6px solid #137A74; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 36px rgba(19, 122, 116, 0.08);">
    <!-- Flip7 Retro Solid Teal Header Accent -->
    <div style="height: 5px; background-color: #137A74;"></div>
    
    <div style="padding: 32px 26px;">
      <!-- Website-Mirrored Header Banner (Instant CID load) -->
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${imgSrc}" alt="CurbDay San Diego" width="480" style="display: block; width: 100%; max-width: 480px; height: auto; margin: 0 auto; border: 0;" />
      </div>

      <!-- Configured Address Badge -->
      <div style="background-color: #FAF7F0; border: 1.5px solid rgba(19, 122, 116, 0.22); border-radius: 14px; padding: 12px 16px; margin-bottom: 22px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #137A74; margin-bottom: 2px;">${addressBadgeTitle}</div>
        <div style="font-size: 15px; font-weight: 800; color: #1C2826;">${displayAddress}</div>
        ${
          isSweeping && options.sweepingDetails?.frequency
            ? `<div style="font-size: 12px; font-weight: 700; color: #64748B; margin-top: 4px;">Cadence: ${options.sweepingDetails.frequency}</div>`
            : ""
        }
      </div>

      <!-- Main Headline -->
      <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #EF6C4A; margin-bottom: 4px;">${eyebrow}</div>
      <h1 style="font-size: 22px; font-weight: 900; color: #1C2826; margin: 0 0 10px 0; line-height: 1.3;">${headline}</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
        ${bodyText}
      </p>

      <!-- Primary Action Button (Flip7 Gold pill button like SaaS reference) -->
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${options.verifyUrl}" style="display: inline-block; background-color: #FFD23F; color: #1C2826; font-size: 15px; font-weight: 900; text-decoration: none; padding: 14px 34px; border-radius: 9999px; border: 1.5px solid #E6B800; box-shadow: 0 4px 14px rgba(255, 210, 63, 0.45);">
          Confirm &amp; Activate Reminders →
        </a>
      </div>

      <div style="padding-top: 18px; border-top: 1px solid rgba(19, 122, 116, 0.15); font-size: 11px; line-height: 1.6; color: #64748B; text-align: center;">
        <p style="margin: 0 0 6px 0;">If you didn't request this email, you can safely ignore it. Your email will not receive any reminders.</p>
        <p style="margin: 0;">
          <a href="https://curbday-sd.vercel.app" style="color: #137A74; text-decoration: underline; font-weight: 700;">View Live Schedule on CurbDay</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

  try {
    const fromAddress = getFromAddress();
    await mailer.sendMail({
      from: fromAddress,
      to: options.to,
      replyTo: `"CurbDay Reminders" <no-reply@curbday-sd.vercel.app>`,
      subject,
      html,
      attachments,
    });
    return true;
  } catch (err) {
    console.error("Gmail send verification error:", err);
    return false;
  }
}

export async function sendStreetSweepingReminder(options: SendStreetSweepingReminderOptions): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("Gmail SMTP transporter not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).");
    return false;
  }

  const { attachment, imgSrc } = getBannerAttachment();
  const attachments = attachment ? [attachment] : [];

  const displayBlock = options.blockRange ? `${options.street} (${options.blockRange})` : options.street;
  const subject = `🚗 Move Your Car: Street sweeping tomorrow morning on ${options.street}`;
  const previewText = `Street sweeping is tomorrow morning${options.timeWindow ? ` (${options.timeWindow})` : ""}. Move parked cars from the curb tonight.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 28px 12px; background-color: #FAF7F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #FAF7F0; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText}
  </div>

  <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 2px solid rgba(19, 122, 116, 0.22); border-left: 6px solid #137A74; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 36px rgba(19, 122, 116, 0.08);">
    <!-- Flip7 Retro Solid Teal Header Accent -->
    <div style="height: 5px; background-color: #137A74;"></div>
    
    <div style="padding: 32px 26px;">
      <!-- Website-Mirrored Header Banner (Instant CID load) -->
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${imgSrc}" alt="CurbDay San Diego" width="480" style="display: block; width: 100%; max-width: 480px; height: auto; margin: 0 auto; border: 0;" />
      </div>

      <!-- Configured Address Badge -->
      <div style="background-color: #FAF7F0; border: 1.5px solid rgba(19, 122, 116, 0.22); border-radius: 14px; padding: 12px 16px; margin-bottom: 22px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #137A74; margin-bottom: 2px;">Sweeping Route Block</div>
        <div style="font-size: 15px; font-weight: 800; color: #1C2826;">${displayBlock}</div>
        <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Address: ${extractStreetAddress(options.address)}</div>
      </div>

      <!-- Main Headline -->
      <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #EF6C4A; margin-bottom: 4px;">Move Your Car Reminder</div>
      <h1 style="font-size: 22px; font-weight: 900; color: #1C2826; margin: 0 0 8px 0; line-height: 1.3;">Street Sweeping Tomorrow Morning</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
        City sweepers are scheduled to sweep your street tomorrow morning. Please move parked vehicles to avoid a citation and keep our neighborhood gutters clear.
      </p>

      <!-- Sweeping Details Card -->
      <div style="background-color: #FFFDF5; border: 2px solid #FFD23F; border-radius: 16px; padding: 20px; margin-bottom: 22px;">
        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #D97706; margin-bottom: 12px;">🚗 Schedule &amp; Parking Hours</div>
        
        <div style="padding: 8px 0; border-bottom: 1px dashed rgba(217, 119, 6, 0.25);">
          <div style="font-size: 13px; font-weight: 800; color: #1C2826;">⏰ Hours: ${options.timeWindow || "Morning hours (check posted signs)"}</div>
        </div>

        <div style="padding: 8px 0; border-bottom: 1px dashed rgba(217, 119, 6, 0.25);">
          <div style="font-size: 13px; font-weight: 800; color: #1C2826;">📍 Side of Street: ${options.sides || "Both Sides"}</div>
        </div>

        ${
          options.frequency
            ? `<div style="padding: 8px 0 0 0;">
                <div style="font-size: 12px; font-weight: 700; color: #64748B;">Cadence: ${options.frequency}</div>
              </div>`
            : ""
        }
      </div>

      <!-- Tip -->
      <div style="background-color: #FFFFFF; border: 1.5px solid rgba(19, 122, 116, 0.22); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #475569; line-height: 1.5;">
        💡 <strong>Pro Tip:</strong> If your block has posted sweeping signs with parking restrictions, parked cars are subject to citation by City parking enforcement. Move your vehicle tonight!
      </div>

      <!-- Footer & Unsubscribe -->
      <div style="padding-top: 18px; border-top: 1px solid rgba(19, 122, 116, 0.15); font-size: 11px; line-height: 1.6; color: #64748B; text-align: center;">
        <p style="margin: 0 0 6px 0;">You received this email because you subscribed to street sweeping reminders for <strong>${extractStreetAddress(options.address)}</strong>.</p>
        <p style="margin: 0;">
          <a href="${options.unsubscribeUrl}" style="color: #137A74; text-decoration: underline; font-weight: 700;">Unsubscribe with one click</a> • 
          <a href="https://curbday-sd.vercel.app" style="color: #137A74; text-decoration: underline; font-weight: 700;">View Live Schedule on CurbDay</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

  try {
    const fromAddress = getFromAddress();
    await mailer.sendMail({
      from: fromAddress,
      to: options.to,
      replyTo: `"CurbDay Reminders" <no-reply@curbday-sd.vercel.app>`,
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<${options.oneClickUnsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      attachments,
    });
    return true;
  } catch (err) {
    console.error("Gmail send sweeping reminder error:", err);
    return false;
  }
}
