import { companyLegal } from "./site";

/** Twilio A2P message flow — use when registering your campaign. */
export const smsMessageFlowDescription = `End users consent to receive text messages from ${companyLegal.name} by submitting a form on our website at ${companyLegal.siteUrl} and entering their phone number. The form includes an unchecked consent box stating that by checking the box, the user agrees to receive SMS messages from ${companyLegal.name}. The consent language states that message and data rates may apply, message frequency may vary, users may reply STOP to opt out, and users may reply HELP for help. Users can also opt in by texting START to our business phone number at ${companyLegal.businessPhoneDisplay}. SMS consent is not a condition of purchase or investment. ${companyLegal.name} does not sell or share SMS opt-in consent or mobile phone numbers with third parties or affiliates for marketing or promotional purposes.`;

export const smsOptInCheckboxLabel = `I agree to receive SMS messages from ${companyLegal.name} at the phone number provided above. Message and data rates may apply. Message frequency may vary. You may reply STOP to opt out and HELP for help. SMS consent is not a condition of purchase or investment. ${companyLegal.name} does not sell or share SMS opt-in consent or mobile phone numbers with third parties or affiliates for marketing or promotional purposes.`;

export const smsPrivacyNotice = `${companyLegal.name} may collect your mobile phone number when you voluntarily provide it through our website forms, business inquiry forms, or by texting an opt-in keyword to our business phone number at ${companyLegal.businessPhoneDisplay}. We use your mobile number to send requested communications, appointment reminders, business updates, inquiry follow-ups, and customer support messages.

${companyLegal.name} does not sell, rent, or share mobile phone numbers or SMS opt-in consent with third parties or affiliates for marketing or promotional purposes.`;

export const smsTerms = `By opting in to receive SMS messages from ${companyLegal.name}, you agree to receive text messages related to your inquiry, scheduling, business updates, and follow-up communications. Message frequency may vary. Message and data rates may apply. You may reply STOP at any time to unsubscribe. You may reply HELP for assistance. Consent to receive SMS messages is not a condition of purchase or investment.`;

export const smsKeywordOptInNote = `You may also opt in to SMS messages by texting START to ${companyLegal.businessPhoneDisplay}.`;
