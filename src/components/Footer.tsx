import Image from "next/image";
import Link from "next/link";
import {
  PiGithubLogoBold,
  PiInstagramLogoBold,
  PiLinkedinLogoBold,
} from "react-icons/pi";
import devdog from "~/assets/devdog.png";

export default function Footer() {
  return (
    <footer
      className="flex flex-col gap-10 border-t border-zinc-800 bg-zinc-950 px-8 py-10 text-sm text-zinc-300 lg:gap-15"
      id="footer"
    >
      <nav className="flex flex-col gap-12 lg:flex-row">
        <div className="flex flex-1 flex-col items-center gap-4 lg:items-start">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-white md:text-xl lg:gap-2.5"
          >
            <figure className="size-[1.5em]">
              <Image alt="Home" src={devdog} />
            </figure>
            <h1 className="contents">DevDogs</h1>
          </Link>

          <p className="text-center text-balance lg:text-left">
            DevDogs is a student-run club at UGA dedicated to benefiting our
            community through code.
          </p>

          <p className="text-center text-balance lg:text-left">
            Each year, we work to develop impactful software from concept to
            completion, learning real-world skills and industry-standard tech
            along the way.
          </p>
        </div>

        <div className="hidden justify-between md:flex lg:contents">
          <div className="flex flex-col gap-2">
            <p className="pb-2 text-lg font-bold text-white">Explore DevDogs</p>
            <ul className="contents">
              <li>
                <Link href="/community" className="hover:underline">
                  Community
                </Link>
              </li>

              <li>
                <Link href="/projects" className="hover:underline">
                  Projects
                </Link>
              </li>

              <li>
                <Link href="/events" className="hover:underline">
                  Events
                </Link>
              </li>

              <li>
                <Link href="/partners" className="hover:underline">
                  Partners
                </Link>
              </li>

              <li>
                <Link href="/join" className="hover:underline">
                  Join Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <p className="pb-2 text-lg font-bold text-white">Resources</p>
            <ul className="contents">
              <li>
                <Link
                  href="https://forum.devdogsuga.org"
                  className="hover:underline"
                  target="_blank"
                >
                  Community Resource Forum
                </Link>
              </li>

              <li>
                <Link
                  href="https://github.com/DevDogs-UGA/Community-Resource-Forum"
                  className="hover:underline"
                  target="_blank"
                >
                  Current Project Repository
                </Link>
              </li>

              <li>
                <Link
                  href="https://github.com/DevDogs-UGA/Community-Resource-Forum/wiki"
                  className="hover:underline"
                  target="_blank"
                >
                  Current Project Wiki
                </Link>
              </li>

              <li>
                <Link href="/legal/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-lg font-bold text-white">Stay in the Loop</p>

            <p className="max-w-50">
              Stay up-to-date with the latest from DevDogs by following us on
              our various social channels.
            </p>

            <ul className="flex items-center gap-2">
              <li className="contents">
                <Link
                  className="rounded-full border border-zinc-400 p-1 text-lg transition-colors hover:border-zinc-200 hover:bg-zinc-900 hover:text-white"
                  href="https://instagram.com/DevDogs_UGA"
                  target="_blank"
                >
                  <PiInstagramLogoBold />
                </Link>
              </li>

              <li className="contents">
                <Link
                  className="rounded-full border border-zinc-400 p-1 text-lg transition-colors hover:border-zinc-200 hover:bg-zinc-900 hover:text-white"
                  href="https://linkedin.com/company/DevDogs-UGA"
                  target="_blank"
                >
                  <PiLinkedinLogoBold />
                </Link>
              </li>

              <li className="contents">
                <Link
                  className="rounded-full border border-zinc-400 p-1 text-lg transition-colors hover:border-zinc-200 hover:bg-zinc-900 hover:text-white"
                  href="https://github.com/DevDogs-UGA"
                  target="_blank"
                >
                  <PiGithubLogoBold />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <p className="flex flex-col items-center justify-between gap-1 border-t border-zinc-700 pt-4 text-zinc-400 sm:flex-row">
        <Link href="mailto:devdogs@uga.edu" className="hover:underline">
          devdogs@uga.edu
        </Link>
        <span>&copy; {new Date().getFullYear()} DevDogs</span>
        <span>&ldquo;Building for better&rdquo;</span>
      </p>
    </footer>
  );
}
