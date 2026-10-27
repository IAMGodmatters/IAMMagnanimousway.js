# Free WhatsApp inquiries for the Magnanimous native store

The Magnanimous store at `/shop` accepts commerce questions through the official `wa.me` WhatsApp link format. This is a free, owner-controlled contact path, **not** a claim that a WhatsApp Business API account has been linked or that WhatsApp can accept customer payments through Magnanimous.

## Owner setup

1. Register a phone number you control using the official WhatsApp Business app, and confirm that it can receive messages. WhatsApp does not generally support Google Voice/VoIP numbers for registration. Use a supported independent mobile number for the WhatsApp account.
2. In `/owner-integrations`, open **Magnanimous Store Customer Contact (Free Links)** and enter `STORE_WHATSAPP_PHONE` in international E.164 form (for example, `+639171234567`). Only set a number you own and have verified.
3. Optionally add an *existing eligible* Google Voice number as `STORE_GOOGLE_VOICE_PHONE` for a separate customer call button. This does not provision Google Voice, establish eligibility, forward calls, or connect it to WhatsApp. Do not purchase or port a phone number merely to activate the button.
4. Confirm on the deployed `/shop` page that contact links open the correct WhatsApp conversation or phone dialer. Removing those values from the owner vault hides the contact buttons after the storefront refreshes.

## Customer journey and cost boundary

- Customers select live, checkout-ready products in Magnanimous and can open WhatsApp with a prefilled product or cart inquiry. Opening a conversation is customer-initiated; no server-side message or paid API call is made.
- The prefilled text contains product titles, quantities, the shop URL, and delivery country only. The site does **not** send customer email, address, payment tokens, or order credentials into WhatsApp.
- Availability, freight, taxes where relevant, and the final total still come from the native Magnanimous quote/checkout. Payment is confirmed by its existing checkout/webhook flow; supplier fulfillment uses the existing account/credential and funding guards.
- The free inquiry route does not make supplier inventory or prepaid fulfillment free. Supplier purchases still require independently verified accounts and sufficient funded balance after a confirmed customer payment.
- Native API automation through Meta's official WhatsApp Business Platform, including outbound templates and webhook handling, remains a distinct opt-in integration with its own provider eligibility, setup, user-consent, and billing restrictions. Do not automate the WhatsApp Business phone app through unofficial browser or device scraping.

## Verification

Run `node qa/scripts/whatsapp-store-contact-lock.mjs`, `node qa/scripts/native-magnanimous-store-lock.mjs`, `node qa/scripts/white-label-whatsapp-lock.mjs`, and `npm run typecheck` from `frontend` (after installing locked dependencies). Verify the deployed shop separately; passing these checks does not prove that an actual WhatsApp or Google Voice account is connected.
