import { useState } from 'react'
import { Link } from '@remix-run/react'

import { APP_ROUTES } from '~/lib/constants'

import FullscreenModal from './FullscreenModal'

export const PublicFooter = () => {
  const [aboutIsOpen, setAboutIsOpen] = useState(false)

  return (
    <footer className="footer footer-center mt-5 rounded bg-base-200 text-base-content">
      <FullscreenModal isOpen={aboutIsOpen} onClose={() => setAboutIsOpen(false)}>
        <AboutUsBody />
      </FullscreenModal>

      <div className="grid grid-flow-col gap-4">
        <Link to={APP_ROUTES.LOGIN.href} className="link-hover link">
          Log in
        </Link>
        <button className="link-hover link" onClick={() => setAboutIsOpen(true)}>
          About
        </button>
        <Link to="mailto:support@birdfeed.ai" className="link-hover link">
          Contact
        </Link>
        <Link to="/privacy" target="_blank" rel="noreferrer" className="link-hover link">
          Privacy
        </Link>
        <Link to="/terms" target="_blank" rel="noreferrer" className="link-hover link">
          Terms
        </Link>
      </div>
      {/* <div>
      <div className="grid grid-flow-col gap-4">
        <a>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
          </svg>
        </a>
        <a>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
          </svg>
        </a>
        <a>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
          </svg>
        </a>
      </div>
    </div>
    <div>
      <p>Copyright © 2023 - All right reserved by ACME Industries Ltd</p>
    </div> */}
    </footer>
  )
}

const AboutUsBody = () => (
  <div className="mx-auto mb-10 flex max-w-md flex-col items-center justify-center">
    <h1 className="mb-4 text-2xl font-bold">Lovingly hand crafted by</h1>
    <div className="my-4 grid grid-cols-3 gap-4">
      <TeamMember
        name="Jake Correa"
        twitter="jaykaycodes"
        avatar="https://pbs.twimg.com/profile_images/1454843700752781313/LTZ3EfnU_400x400.jpg"
      />
      <TeamMember
        name="Josh Terry"
        twitter="JoshTerryPlays"
        avatar="https://pbs.twimg.com/profile_images/1363667585649283072/ivtEZkLJ_400x400.jpg"
      />
      <TeamMember
        name="Justin Hilliard"
        twitter="jahilliar"
        avatar="https://pbs.twimg.com/profile_images/1544887890844401666/tOkGd3Dl_400x400.jpg"
      />
    </div>

    <p className="max-w-sm">
      Questions? Comments? Feel free to reach out to us on Twitter, we'd love to hear from you!
    </p>
  </div>
)

const TeamMember = ({ twitter, avatar }: { name: string; twitter: string; avatar: string }) => (
  <div>
    <div className="avatar">
      <a href={`https://twitter.com/${twitter}`} target="_blank" rel="noreferrer" className="w-14 rounded-xl">
        <img src={avatar} alt={twitter} className="h-10 w-10 rounded-full" />
      </a>
    </div>
    <a href={`https://twitter.com/${twitter}`} target="_blank" rel="noreferrer">
      {/* <h3 className="text-lg">{name}</h3> */}
      <p className="link-primary link text-sm">@{twitter}</p>
    </a>
  </div>
)
