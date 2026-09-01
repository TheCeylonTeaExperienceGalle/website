import { lazy, Suspense, useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import Loading from './components/Loading'
import PageMetadata from './components/PageMetadata'
import './App.css'

const AboutPage = lazy(() => import('./pages/AboutPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const GalleryPage = lazy(() => import('./pages/GalleryPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'))
const TermsConditions = lazy(() => import('./pages/TermsConditions'))
const PartnersPage = lazy(() => import('./pages/PartnersPage'))
const BlogIndexPage = lazy(() => import('./pages/BlogIndexPage'))
const BlogArticlePage = lazy(() => import('./pages/BlogArticlePage'))
const BlogNotFoundPage = lazy(() => import('./pages/BlogNotFoundPage'))

const articlePath = '/blog/why-you-should-visit-the-ceylon-tea-experience-in-galle'
const validPages = ['home', 'about', 'services', 'gallery', 'contact', 'privacy', 'refund', 'terms']

const publicPages = {
  home: HomePage,
  about: AboutPage,
  services: ServicesPage,
  gallery: GalleryPage,
  contact: ContactPage,
  privacy: PrivacyPolicy,
  refund: RefundPolicy,
  terms: TermsConditions,
}

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '').replace('/', '').trim()
  return validPages.includes(hash) ? hash : 'home'
}

function getSmsCampaignRedirect() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const match = pathname.match(/^\/s\/([^/]+)$/)
  if (!match) return null

  const campaign = decodeURIComponent(match[1])
  return `/?utm_source=sms&utm_medium=sms&utm_campaign=${encodeURIComponent(campaign)}`
}

function getDirectRoute() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'

  if (pathname === '/partners') return 'partners'
  if (pathname === '/blog') return 'blog'
  if (pathname === articlePath) return 'blogArticle'
  if (pathname.startsWith('/blog/')) return 'blogNotFound'
  return null
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash)
  const [directRoute, setDirectRoute] = useState(getDirectRoute)

  const navigate = (page) => {
    if (page === 'blog') {
      window.location.assign('/blog')
      return
    }

    if (!validPages.includes(page)) return

    if (getDirectRoute()) {
      window.location.assign(page === 'home' ? '/' : `/#${page}`)
      return
    }

    window.location.hash = page
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const smsRedirect = getSmsCampaignRedirect()
    if (smsRedirect) {
      window.location.replace(smsRedirect)
      return
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('utm_source') === 'sms') {
      sessionStorage.setItem('utm_source', 'sms');
      sessionStorage.setItem('utm_campaign', params.get('utm_campaign') ?? '');
      try {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'sms_landing', {
            campaign: params.get('utm_campaign') ?? 'unknown',
          });
        }
      } catch (e) {
        console.warn('[TCTE] sms_landing tracking error:', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handlePopState = () => {
      setDirectRoute(getDirectRoute())
      setCurrentPage(getPageFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  if (directRoute === 'partners') {
    return (
      <Suspense fallback={<Loading />}>
        <PartnersPage />
      </Suspense>
    )
  }

  if (directRoute === 'blog') {
    return (
      <Suspense fallback={<Loading />}>
        <BlogIndexPage navigate={navigate} />
      </Suspense>
    )
  }

  if (directRoute === 'blogArticle') {
    return (
      <Suspense fallback={<Loading />}>
        <BlogArticlePage navigate={navigate} />
      </Suspense>
    )
  }

  if (directRoute === 'blogNotFound') {
    return (
      <Suspense fallback={<Loading />}>
        <BlogNotFoundPage navigate={navigate} />
      </Suspense>
    )
  }

  const CurrentPage = publicPages[currentPage] ?? HomePage

  return (
    <>
      <PageMetadata page={currentPage} />
      <Suspense fallback={<Loading />}>
        <CurrentPage navigate={navigate} />
      </Suspense>
    </>
  )
}
