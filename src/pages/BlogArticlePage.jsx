import { useCallback, useEffect, useState } from 'react'
import { Clock, MapPin } from 'lucide-react'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import PageMetadata from '../components/PageMetadata'
import WhatsAppFloatingButton from '../components/WhatsAppFloatingButton'
import { WhatsAppInquiryModal } from '../components/WhatsAppModal'
import ArticleBlocks from '../components/blog/ArticleBlocks'
import ArticleShare from '../components/blog/ArticleShare'
import ResponsiveImage from '../components/blog/ResponsiveImage'
import { getBlogPostByPath } from '../data/blogPosts'
import BlogNotFoundPage from './BlogNotFoundPage'
import '../styles/journal.css'

const WHATSAPP_AVOID_SELECTORS = [
  '.journal-location-note',
  '.journal-article-cta',
  '.journal-share',
  '.journal-figure',
  'footer',
]

function trackCta(action) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'blog_article_cta_click', {
      send_to: 'G-B23WLR63LD',
      action,
    })
  }
}

export default function BlogArticlePage({ navigate, post: postProp }) {
  const post = postProp ?? getBlogPostByPath(window.location.pathname)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const openBookingModal = useCallback(() => setBookingModalOpen(true), [])
  const closeBookingModal = useCallback(() => setBookingModalOpen(false), [])

  useEffect(() => {
    if (!window.location.hash) return

    const target = document.getElementById(window.location.hash.slice(1))
    target?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [post?.slug])

  if (!post) {
    return <BlogNotFoundPage navigate={navigate} />
  }

  const handleTocClick = (event, id) => {
    event.preventDefault()
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
    window.history.replaceState(null, '', `#${id}`)
  }

  const bookExperience = () => {
    trackCta('book_experience')
    openBookingModal()
  }

  return (
    <div className="journal-page min-h-screen bg-[#FCFBF8] font-sans text-[#293129]">
      <PageMetadata page="blogArticle" post={post} />
      <Nav navigate={navigate} currentPage="blog" onBookNow={openBookingModal} />

      <main id="main-content">
        <article className="journal-article">
          <header className="journal-article-hero">
            <div className="journal-shell journal-article-hero__content">
              <nav className="journal-breadcrumb" aria-label="Breadcrumb">
                <ol>
                  <li><a href="/">Home</a></li>
                  <li aria-hidden="true">/</li>
                  <li><a href="/blog">Journal</a></li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page">{post.location}</li>
                </ol>
              </nav>

              <p className="journal-article-hero__category">
                {post.category} <span aria-hidden="true">·</span> {post.location}{' '}
                <span aria-hidden="true">·</span> Ceylon Tea
              </p>
              <h1>{post.title}</h1>
              <p className="journal-article-hero__deck">{post.deck}</p>

              <div className="journal-article-hero__meta">
                <span>By {post.author}</span>
                <time dateTime={post.datePublished}>{post.displayDate}</time>
                <span>
                  <Clock aria-hidden="true" size={16} />
                  {post.readingTime} min read
                </span>
              </div>
            </div>

            <figure className="journal-hero-image">
              <ResponsiveImage
                image={post.heroImage}
                loading="eager"
                fetchPriority="high"
                className={`journal-hero-image__media${
                  post.heroImageFit === 'contain' ? ' journal-hero-image__media--contain' : ''
                }`}
              />
              <figcaption>
                {post.heroCaption ?? 'Guests discovering the pleasure of freshly brewed Ceylon Tea in Galle.'}
              </figcaption>
            </figure>
          </header>

          <div className="journal-article-layout journal-shell">
            <aside className="journal-toc">
              <nav aria-label="In this story">
                <p className="journal-eyebrow">In this story</p>
                <ol>
                  {post.sections.map((section, index) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} onClick={(event) => handleTocClick(event, section.id)}>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>

            <div className="journal-article-body">
              <div className="journal-introduction">
                <ArticleBlocks blocks={post.intro} />
              </div>

              <aside className="journal-location-note" aria-label="Experience location and highlights">
                <div>
                  <p className="journal-eyebrow">The Ceylon Tea Experience</p>
                  <p className="journal-location-note__place">
                    <MapPin aria-hidden="true" size={18} /> Galle, Sri Lanka
                  </p>
                  <p>Approximately 300 metres from Galle Fort</p>
                </div>
                <ul>
                  <li>Hands-on tea making</li>
                  <li>Guided tea tasting</li>
                  <li>Personalised tea blending</li>
                </ul>
                <a href="/#services">Explore the experience</a>
              </aside>

              {post.sections.map((section) => (
                <section key={section.id} id={section.id} className="journal-story-section">
                  <h2>{section.heading}</h2>
                  <ArticleBlocks blocks={section.blocks} />
                </section>
              ))}

              <section className="journal-article-cta" aria-labelledby="journal-cta-title">
                <p className="journal-eyebrow">Ready to experience Ceylon Tea?</p>
                <h2 id="journal-cta-title">Don’t just read about the journey. Become part of it.</h2>
                <div>
                  <button type="button" onClick={bookExperience}>Book your experience</button>
                  <a href="/#services" onClick={() => trackCta('explore_experiences')}>
                    Explore experiences
                  </a>
                </div>
              </section>

              <ArticleShare post={post} />
            </div>
          </div>
        </article>
      </main>

      <WhatsAppFloatingButton
        avoidSelectors={WHATSAPP_AVOID_SELECTORS}
        onOpen={openBookingModal}
      />
      <WhatsAppInquiryModal isOpen={bookingModalOpen} onClose={closeBookingModal} />
      <Footer navigate={navigate} />
    </div>
  )
}
