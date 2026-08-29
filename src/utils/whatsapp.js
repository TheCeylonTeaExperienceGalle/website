export const inquiryOptions = [
  {
    icon: '🍃',
    title: 'Hand-Made Tea & Tasting',
    desc: '60-min guided hands-on session',
    message:
      "Hi TCTE! I'm interested in the Hand-Made Tea & Tasting experience. Could you please share available time slots, pricing, and what the session includes?",
  },
  {
    icon: '🌱',
    title: 'Plantation Tour',
    desc: "Walk through Ceylon's tea heritage",
    message:
      "Hi TCTE! I'd love to book a Plantation Tour. Could you share available dates, tour duration, pricing, and what the experience covers?",
  },
  {
    icon: '🌿',
    title: 'Build Your Own Tea (BYOT)',
    desc: 'Create your personalised blend',
    message:
      "Hi TCTE! I'm interested in the Build Your Own Tea (BYOT) experience. Please share how it works, available slots, and pricing.",
  },
  {
    icon: '📚',
    title: 'The Tea Library',
    desc: 'Explore & purchase our tea collection',
    message:
      "Hi TCTE! I'd like to explore The Tea Library. Could you share what teas are currently available, pricing, and how I can visit or browse the collection?",
  },
  {
    icon: '📦',
    title: 'E-Commerce & Delivery',
    desc: 'Order Ceylon tea — local or worldwide',
    message:
      "Hi TCTE! I'd like to order Ceylon tea for delivery. Could you share your available products, delivery options, and shipping costs to my location?",
  },
  {
    icon: '👥',
    title: 'Workshops & Groups',
    desc: 'Corporate, schools & private groups',
    message:
      "Hi TCTE! I'd like to inquire about a group or workshop booking. Please share available packages, group size options, pricing, and available dates.",
  },
]

const WA_NUMBER = '94702900500'
const GA4_MEASUREMENT_ID = 'G-B23WLR63LD'

export function openWhatsApp(message, eventContext = {}) {
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'whatsapp_enquiry', {
        send_to: GA4_MEASUREMENT_ID,
        source: eventContext.source ?? 'booking_flow',
        experience: eventContext.experience ?? 'not_specified',
        utm_source: sessionStorage.getItem('utm_source') ?? 'direct',
        utm_campaign: sessionStorage.getItem('utm_campaign') ?? '',
      })
    }

    if (typeof window.gtag_report_conversion === 'function') {
      window.gtag_report_conversion()
    }
  } catch (error) {
    console.warn('[TCTE] gtag error:', error)
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}
