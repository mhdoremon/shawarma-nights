/**
 * Complete Legal Policies Data for ChuruOne Ecosystem
 * Includes:
 * 1. ChuruOne (City Directory & Platform Level)
 * 2. Shawarma Nights (Culinary & Food Delivery)
 * 3. Nash Studio (Salon & Grooming Lounge)
 */

export const LEGAL_POLICIES = {
  // ─── 1. CHURUONE PLATFORM POLICIES ──────────────────────────────────────
  churuone: {
    brandName: 'ChuruOne',
    legalEntity: 'ChuruOne Technologies',
    tagline: 'City Directory & Direct Commerce Infrastructure',
    address: 'Churu, Rajasthan 331001, India',
    email: 'contact@churuone.in',
    phone: '+91 70239 63189',
    lastUpdated: 'October 2026',

    terms: {
      title: 'Terms & Conditions',
      effectiveDate: 'October 1, 2026',
      sections: [
        {
          heading: '1. Introduction & Acceptance of Terms',
          content: `Welcome to ChuruOne (churuone.in). By accessing our city directory, web portals, mobile interfaces, or any affiliated services, you agree to be bound by these Terms and Conditions. If you do not agree to all terms, please discontinue use of the platform.`
        },
        {
          heading: '2. Platform Nature & Direct Commerce Model',
          content: `ChuruOne operates as a direct digital infrastructure platform connecting local verified merchants in Churu, Rajasthan with citizens. ChuruOne is not an aggregator, broker, or culinary/grooming provider. Each partner merchant operates an independent storefront with direct pricing, live inventory, and direct UPI bank settlement. ChuruOne levies zero commission markup on consumer orders.`
        },
        {
          heading: '3. User Accounts & Single Sign-On (SSO)',
          content: `Users may create a unified ChuruOne account using Google OAuth or mobile verification. You are responsible for maintaining the confidentiality of your session credentials and ensuring that all information provided (including contact numbers and delivery addresses) is accurate and current.`
        },
        {
          heading: '4. Direct Merchant Transactions',
          content: `All purchases, food orders, and appointment bookings placed through ChuruOne storefronts constitute direct commercial contracts between you and the respective merchant. Product preparation, hygiene standards, delivery execution, and grooming services remain the sole responsibility of the respective merchant partner.`
        },
        {
          heading: '5. Intellectual Property & Acceptable Use',
          content: `All logos, trademarks, interface designs, code, and editorial directory content on ChuruOne are the intellectual property of ChuruOne Technologies or licensed partners. Unlawful scraping, reverse-engineering, or unauthorized distribution of platform assets is strictly prohibited.`
        },
        {
          heading: '6. Limitation of Liability & Governing Law',
          content: `To the maximum extent permitted by applicable Indian law, ChuruOne Technologies shall not be liable for any indirect, incidental, or consequential damages resulting from third-party merchant service quality. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Churu, Rajasthan.`
        }
      ]
    },

    privacy: {
      title: 'Privacy Policy',
      effectiveDate: 'October 1, 2026',
      sections: [
        {
          heading: '1. Information We Collect',
          content: `When you use ChuruOne, we may collect:
• Personal Identity: Name, email address, profile picture (via Google Sign-In).
• Contact Information: 10-digit mobile number for order dispatch and SMS OTP verification.
• Delivery Details: Physical delivery addresses, landmarks, and delivery instructions.
• Transaction History: Order timestamps, merchant IDs, and booking tokens.`
        },
        {
          heading: '2. How We Use Your Information',
          content: `Your data is used strictly to:
• Facilitate single sign-on access across all ChuruOne partner stores.
• Transmit order delivery and appointment booking details to the selected merchant.
• Dispatch vital transaction notifications, delivery OTPs, and receipt confirmations.
• Ensure security, prevent fraudulent activity, and comply with legal requirements.`
        },
        {
          heading: '3. Zero Data Sale Commitment',
          content: `We have a strict privacy standard: ChuruOne NEVER sells, rents, leases, or trades your personal information or contact details to third-party ad networks, telemarketers, or external data brokers.`
        },
        {
          heading: '4. Data Storage & Security',
          content: `All communications are encrypted in transit using SSL/TLS protocols. Access to customer data is strictly controlled and authenticated via industry-standard security protocols.`
        },
        {
          heading: '5. Your Rights & Account Deletion',
          content: `You have the right to inspect, update, or request the permanent deletion of your ChuruOne profile and saved data at any time by contacting our privacy desk at contact@churuone.in.`
        }
      ]
    },

    refund: {
      title: 'Refund & Cancellation Policy',
      effectiveDate: 'October 1, 2026',
      sections: [
        {
          heading: '1. Universal Cancellation Standard',
          content: `For food delivery orders placed across the ChuruOne directory network: Orders can be cancelled within 10 minutes of placement, and refunds are processed in 2-3 business days to the original payment source. For appointment-based services (e.g. salon grooming), advance slot tokens are refundable or reschedulable if cancelled at least 1 hour prior to the reserved slot.`
        },
        {
          heading: '2. Direct Merchant Settlement Model',
          content: `Because ChuruOne operates on a direct-to-bank UPI architecture without taking intermediary cuts, payments are made directly to the merchant's verified UPI account. Consequently, refunds and dispute resolutions are executed by the respective merchant according to their published storefront policy.`
        },
        {
          heading: '3. Refund Timeline & Processing',
          content: `Once a cancellation is initiated within the eligible 10-minute window, the merchant confirms the cancellation on their Dukandar Terminal. Refunds are processed within 2-3 business days back to the customer's original UPI ID or bank account.`
        },
        {
          heading: '4. Dispute Support & Contact',
          content: `If you encounter any delay in refund processing or merchant communication, ChuruOne provides dedicated mediation support. Reach out via WhatsApp or phone at +91 70239 63189 or email contact@churuone.in with your Order ID for prompt resolution within 24 hours.`
        }
      ]
    }
  },

  // ─── 2. SHAWARMA NIGHTS POLICIES ─────────────────────────────────────────
  shawarma: {
    brandName: 'Shawarma Nights',
    legalEntity: 'Shawarma Nights Kitchen',
    tagline: 'Artisanal Charcoal Spit Kitchen & Midnight Delivery',
    address: 'Subhash Chowk / Central Food Street, Churu, Rajasthan 331001',
    email: 'shawarmanightschuru@gmail.com',
    phone: '+91 70239 63189',
    lastUpdated: 'October 2026',

    terms: {
      title: 'Terms & Conditions',
      effectiveDate: 'October 1, 2026',
      sections: [
        {
          heading: '1. Store Overview & Menu Services',
          content: `Shawarma Nights is an artisanal charcoal spit kitchen operating in Churu, Rajasthan, specializing in freshly carved Lebanese shawarma rolls, gourmet charcoal burgers, and signature loaded platters. By ordering through our official web app (shawarma.churuone.in), you accept these terms.`
        },
        {
          heading: '2. Operating Hours & Delivery Corridor',
          content: `Our kitchen operates daily with midnight delivery hours (typically 12:00 PM to 04:00 AM). Delivery services are provided within a designated 10 KM delivery corridor across Churu city. Delivery estimates (typically 20–30 minutes) are subject to weather, peak traffic, and order volumes.`
        },
        {
          heading: '3. Pricing & Exclusive UPI Payment Policy',
          content: `All prices listed on our menu reflect authentic in-store pricing with zero hidden aggregator surcharges. Payment is accepted exclusively via Direct UPI through any UPI application (Google Pay, PhonePe, Paytm, BHIM, Cred, etc.). Debit/credit cards, net banking, and Cash on Delivery (COD) are not supported. Every order must be prepaid directly to the merchant's verified UPI account.`
        },
        {
          heading: '4. Food Preparation & Allergen Disclosure',
          content: `All meats are 100% Halal certified and prepared fresh on charcoal spits daily. If you have specific dietary restrictions, food allergies (e.g., dairy, garlic, sesame, gluten), or spiciness preferences, please specify them in the order notes prior to completing checkout.`
        },
        {
          heading: '5. Delivery Handoff & Customer Availability',
          content: `Customers must ensure an active, reachable 10-digit mobile number and accurate address are provided. The delivery partner will contact the customer upon arrival. If the customer is unreachable after 3 consecutive attempts or fails to collect the order within 10 minutes of arrival, the order will be deemed delivered.`
        }
      ]
    },

    privacy: {
      title: 'Privacy Policy',
      effectiveDate: 'October 1, 2026',
      sections: [
        {
          heading: '1. Information Collected',
          content: `We collect essential order details including your Name, Mobile Number, Delivery Address, Landmark, and Order Notes to fulfill food preparation and delivery.`
        },
        {
          heading: '2. Purpose of Collection',
          content: `Customer information is used strictly for:
• Kitchen order assembly and preparation updates.
• Dispatching delivery rider notifications and location tracking.
• Transmitting order verification OTPs via the Dukandar SMS Gateway.
• Processing UPI payment confirmations.`
        },
        {
          heading: '3. Protection of Customer Data',
          content: `Shawarma Nights maintains strict confidentiality of all customer details. We do not sell or disclose your personal contact information to any external advertisers or marketing agencies.`
        },
        {
          heading: '4. Contact & Support',
          content: `For any queries regarding your data or order history, contact the kitchen management directly via WhatsApp at +91 70239 63189.`
        }
      ]
    },

    refund: {
      title: 'Refund & Cancellation Policy',
      effectiveDate: 'October 1, 2026',
      sections: [
        {
          heading: '1. 10-Minute Order Cancellation Policy',
          content: `Orders can be cancelled within 10 minutes of placement. Because each charcoal roll and burger is freshly crafted and slow-roasted upon order, cancellations are accepted within the first 10 minutes before kitchen preparation begins.`
        },
        {
          heading: '2. Refund Processing Time (2-3 Business Days)',
          content: `When an order is cancelled within the eligible 10-minute window, a 100% refund is initiated immediately and processed in 2-3 business days directly to the customer's original UPI ID or bank account.`
        },
        {
          heading: '3. Product Return Policy (Self-Return within 2–3 KM)',
          content: `Product Return & Exchange Policy: For food quality disputes, incorrect dishes, or packaging concerns, customers residing within a 2 to 3 km radius of the kitchen are eligible for direct self-return / exchange at the kitchen outlet within 2 hours of delivery. Customers may also report any issue via our WhatsApp hotline (+91 70239 63189) with a photo of the item and bill for prompt re-dispatch or refund processed in 2-3 days.`
        },
        {
          heading: '4. Ineligible Cancellation Scenarios',
          content: `Orders cannot be cancelled once 10 minutes have elapsed from the time of placement, or once the order status is marked as "Preparing" or "Out for Delivery", as perishable ingredients cannot be restocked.`
        }
      ]
    }
  },

  // ─── 3. NASH STUDIO POLICIES ─────────────────────────────────────────────
  'nash-studio': {
    brandName: 'Nash Studio',
    legalEntity: 'Nash Studio Lounge',
    tagline: 'Private Gentleman Grooming Lounge & Appointment Studio',
    address: 'Main Market / City Center, Churu, Rajasthan 331001',
    email: 'nashstudiochuru@gmail.com',
    phone: '+91 70239 63189',
    lastUpdated: 'October 2026',

    terms: {
      title: 'Terms & Conditions',
      effectiveDate: 'October 1, 2026',
      sections: [
        {
          heading: '1. Service Scope & Studio Atmosphere',
          content: `Nash Studio provides private, appointment-based grooming services for gentlemen in Churu, Rajasthan, including luxury skin fades, beard sculpting, textured scissor work, hair spa, and facial treatments. By booking an appointment via nash.churuone.in, you agree to these terms.`
        },
        {
          heading: '2. Zero Wait-Time Appointment Standard',
          content: `To guarantee an exclusive lounge experience with zero wait-time, all appointments are scheduled for specific dedicated time blocks. Clients are requested to arrive at the studio 5 minutes prior to their reserved slot.`
        },
        {
          heading: '3. ₹50 Advance Token Policy (Non-Refundable on Cancellation)',
          content: `A reservation token of ₹50 is required at the time of online slot booking. This token is fully adjusted against the final service bill at the counter. Booking cancellation par token money ka koi refund nahi milega kyunki customer se sirf seat confirm karne ke liye nominal token charge kiya gaya hai.`
        },
        {
          heading: '4. Late Arrival Policy',
          content: `If a client arrives more than 15 minutes past their scheduled appointment time without advance notice, the studio reserves the right to release the slot to accommodate waiting walk-in patrons in order to maintain the master schedule.`
        },
        {
          heading: '5. Hygiene & Sanitation Commitment',
          content: `All scissors, clippers, razors, and grooming tools are sanitized and sterilized after every single client. Fresh disposable neck strips and capes are provided for maximum hygiene.`
        }
      ]
    },

    privacy: {
      title: 'Privacy Policy',
      effectiveDate: 'October 1, 2026',
      sections: [
        {
          heading: '1. Information We Collect',
          content: `We collect client name, mobile phone number, preferred stylist/service choices, and appointment history to coordinate scheduled grooming sessions.`
        },
        {
          heading: '2. Usage of Client Information',
          content: `Client information is used exclusively to:
• Send slot confirmation reminders and digital appointment passes.
• Maintain personalized haircut specifications and grooming preferences.
• Facilitate advance token payments and digital receipts.`
        },
        {
          heading: '3. Confidentiality Standard',
          content: `Nash Studio holds customer privacy in the highest regard. We never share, sell, or disclose your personal details to third-party marketing services.`
        }
      ]
    },

    refund: {
      title: 'Refund & Cancellation Policy',
      effectiveDate: 'October 1, 2026',
      sections: [
        {
          heading: '1. No Refund on Booking Cancellation Policy',
          content: `Please note that NO refunds are issued upon appointment cancellation. Only a nominal token money (₹50) is charged to secure and reserve the exclusive barber chair and grooming slot. Booking cancel karne par token money ka koi refund nahi milega kyunki customer se sirf seat confirm karne ke liye nominal token charge kiya gaya hai.`
        },
        {
          heading: '2. Nominal Token Money Justification',
          content: `Because a dedicated stylist, barber chair, and time slot are reserved exclusively for you with a zero wait-time guarantee, the ₹50 token money covers the slot commitment and prevents ghost reservations. Cancellations or slot relinquishments will not be refunded.`
        },
        {
          heading: '3. Rescheduling Window',
          content: `While token fees are strictly non-refundable upon cancellation, clients may reschedule their appointment slot up to 2 hours prior to the booked time without forfeiting their token, subject to barber availability.`
        },
        {
          heading: '4. Studio Cancellation Guarantee',
          content: `In the rare event that Nash Studio must cancel an appointment due to unforeseen studio maintenance or emergency, clients will receive an immediate full ₹50 token refund processed in 2-3 business days plus priority re-booking.`
        }
      ]
    }
  }
};
