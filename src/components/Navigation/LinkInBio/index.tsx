import Link from "next/link";
import {
  ArrowRightIcon,
  GithubLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  EnvelopeSimpleIcon,
} from "@phosphor-icons/react/ssr";
import LinkButton from "~/ui/link-button";
import ShareButton from "./ShareButton";

export default function LinkInBio() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-12 py-4">
      <div className="flex w-full flex-col items-center gap-6">
        <p className="animate-wave cursor-default text-5xl">👋</p>
        <p className="text-center">
          <span className="inline-block">
            Hey, we&rsquo;re DevDogs, a club at UGA building
          </span>
          <span className="inline-block">
            software with an impact. Join us below!
          </span>
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <LinkButton
          href="/join"
          className="hover:shadow-block-md flex items-center justify-center gap-5 rounded-sm border border-black bg-cyan-400 px-12 py-3 text-xl font-extrabold tracking-wide text-black shadow-none transition-[translate,box-shadow] hover:-translate-x-1 hover:-translate-y-1"
        >
          Join DevDogs!
        </LinkButton>
        <Link
          href="?"
          className="flex items-center justify-center gap-2 rounded-sm border border-black bg-white px-4 py-2 font-medium text-mauve-950 hover:bg-mauve-100"
          scroll={false}
        >
          Continue to Website
          <ArrowRightIcon />
        </Link>
      </div>

      <div className="flex w-full flex-col gap-3">
        <ShareButton
          href="https://uga.campuslabs.com/engage/organization/devdogs"
          title="UGA Involvement Network Listing"
          shareText=""
        />
        <ShareButton
          href="https://gdg.community.dev/gdg-on-campus-university-of-georgia-athens-united-states/"
          title="Google DGC: UGA Listing"
          shareText=""
        />
        <ShareButton
          href="https://docs.google.com/forms/d/e/1FAIpQLSfH6BQCUm96Q9rUu-WKVeG6qzM4tRrXzfwxj_Np8XJoZtlZJQ/viewform"
          title="Focus Lead Interest Form"
          shareText=""
        />
        <ShareButton
          href="https://forms.gle/7DFteDC9iGu5rVCL7"
          title="A-Team Interest Form"
          shareText=""
        />
      </div>

      <div className="flex gap-8 text-2xl text-mauve-700">
        <Link
          className="transition-[scale,color] hover:scale-120 hover:text-black"
          href="#"
          target="_blank"
        >
          <InstagramLogoIcon />
        </Link>
        <Link
          className="transition-[scale,color] hover:scale-120 hover:text-black"
          href="#"
          target="_blank"
        >
          <GithubLogoIcon />
        </Link>
        <Link
          className="transition-[scale,color] hover:scale-120 hover:text-black"
          href="#"
          target="_blank"
        >
          <LinkedinLogoIcon />
        </Link>
        <Link
          className="transition-[scale,color] hover:scale-120 hover:text-black"
          href="#"
          target="_blank"
        >
          <EnvelopeSimpleIcon />
        </Link>
      </div>
    </div>
  );
}
